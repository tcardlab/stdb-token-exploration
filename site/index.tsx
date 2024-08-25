import { SpacetimeDBClient, Identity, DatabaseTableClass } from "@clockworklabs/spacetimedb-sdk";
import { register } from './module_bindings/index.js'
await register()

import {
  /*Tables  */ Message, User, 
  /*Reducers*/ SendMessageReducer, SetNameReducer
} from './module_bindings/index.js'


let client:SpacetimeDBClient;
declare var window: Window & {global_token: string|undefined, global_identity:Identity|undefined}


/***   ROUTER   ***\
  Runs different connection strategies based on the route.
  They all have the same UI.
*/
import uncaught from "./variants/uncaught.js";
import catch_ from "./variants/catch.js";
import pre_catch from "./variants/precatch.js";
import fix_token from "./variants/fix-token.js";

console.log(location.pathname)
window.global_token = 'somebadtoken';
switch (location.pathname) {
  case '/pages/uncaught': {
    client = new SpacetimeDBClient('ws://localhost:4000', 'project', window.global_token);
    uncaught(client)
    break
  }
  case '/pages/catch': {
    client = new SpacetimeDBClient('ws://localhost:4000', 'project', window.global_token);
    catch_(client)
    break
  }
  case '/pages/precatch': {
    client = new SpacetimeDBClient('ws://localhost:4000', 'project', window.global_token);
    pre_catch(client)
    break
  }
  case '/pages/fix-token': {
    client = new SpacetimeDBClient('ws://localhost:4000', 'project', window.global_token);
    fix_token(client)
    break
  }
  default:
    // Fresh connection with new, valid token
    localStorage.removeItem('stdb_auth_token')
    window.global_token = undefined;
    client  = new SpacetimeDBClient('ws://localhost:4000', 'project', window.global_token);
    uncaught(client)
}



/***   MESSAGE APP UI   ***\
  A minimal implementation of the tutorial message app.
*/
let msg_box:HTMLElement|null=null;
let app = document.getElementById('app')
type Row<T> = T extends abstract new (...args: any) => any ? never : T;
function main () {
  let self = window.global_identity && User.filterByIdentity(window.global_identity).next().value as Row<User>
  app?.replaceChildren(<div>
    {/* <p>Loaded</p><br/> */}
    <h3>Self: {safe_name(self??null)}</h3><br/>

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

type FormEvent<E>=  E & { target: HTMLFormElement };
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