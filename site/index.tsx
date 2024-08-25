import { SpacetimeDBClient, Identity, DatabaseTableClass } from "@clockworklabs/spacetimedb-sdk";
import { register } from './module_bindings/index.js'
await register()

import {
  /*Tables  */ Message, User, 
  /*Reducers*/ SendMessageReducer, SetNameReducer
} from './module_bindings/index.js'

let global_identity:Identity;
let global_token = localStorage.getItem('stdb_auth_token') || undefined;
let client = new SpacetimeDBClient('ws://localhost:4000', 'project', global_token);
let app = document.getElementById('app')



client.onConnect((token, identity)=>{
  console.log('connect');

  ([global_token, global_identity]  = [token, identity])
  localStorage.setItem('stdb_auth_token', token)
  localStorage.setItem('stdb_auth_identity', identity.toHexString())

  client.subscribe([
    "SELECT * FROM User",
    "SELECT * FROM Message"
  ])

  //main()
})
client.connect()

let msg_box:HTMLElement|null=null;
type Row<T> = T extends abstract new (...args: any) => any ? never : T;

function main () {
  let self = User.filterByIdentity(global_identity).next().value as Row<User>
  app?.replaceChildren(<div>
    {/* <p>Loaded</p><br/> */}
    <h3>Self: {safe_name(self)}</h3><br/>

    <div id="msg-box" style="max-height: 200px; overflow:scroll; width: 300px">{
      Message.all().map(build_msg)
    }</div>

    <div class="new-message">
      <form
        onsubmit={onMessageSubmit}
        style={CSS({
          display: "flex",
          width: "50%",
          margin: "0 auto",
          "flex-direction": "column",
        })}
      >
        <h3>New Message</h3>
        <textarea name="new-message" />
        <button type="submit">Send</button>
      </form>

    </div>
  </div>)

  msg_box = document.getElementById('msg-box')
  scollBottom(msg_box!)
}


Message.onInsert((msg, red)=>{
  if(!red) return
  
  if(!msg_box) msg_box = document.getElementById('msg-box')
  msg_box?.appendChild(build_msg(msg) as Node)
  scollBottom(msg_box!)
})


client.on('initialStateSync', main)



/***   UTILS   ***/
function safe_name(user: User|null): string {
  if (!user) return 'unknown'
  if (user.name !== null) {
    return user.name || "";
  }
  else {
    let identityStr = user.identity.toHexString();
    return identityStr.substring(0, 8);
  }
}

let getUser = (ID: Identity)=>{
  if(ID === undefined) return null
  let val = User.filterByIdentity(ID).next()
  return val.value;
}

type TargetEvent<E>=  E & {
  target: HTMLInputElement;
};
type FormEvent<E>=  E & {
  target: HTMLFormElement;
};
const onMessageSubmit = (e: FormEvent<SubmitEvent>) => {
  e.preventDefault();
  let data = new FormData(e.target)
  let msg = data.get('new-message') as string
  if (!msg) return console.warn('Message must have content.')
  
  SendMessageReducer.call(msg);
  e.target.reset()
};

function CSS(obj: Record<string, string|number>) {
  let cssString = '';
  for (const property in obj) {
    cssString += `${property}: ${obj[property]}; `;
  }
  return cssString.trim();
}

function build_msg(msg:Row<Message>) {
  return <p>{safe_name(getUser(msg.sender))}: {msg.text}</p>
}

let scollBottom = (msgEl:HTMLElement) => msgEl.scrollTop = msgEl.scrollHeight;