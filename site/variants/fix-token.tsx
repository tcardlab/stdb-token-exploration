import { Identity, SpacetimeDBClient } from "@clockworklabs/spacetimedb-sdk";
declare var window: Window & {global_token:any, global_identity:any}


export default function (client:SpacetimeDBClient) {
  /* 
    After detecting the token is invalid, its not clear how
    we should reconcile the issue:
    - just update the token property on client instance?
    - reconnect WS with new token?
    - reload the page
    - something else?
  */

  let initToken = client?.['runtime']?.auth_token
  client.onConnect(async (token, identity)=>{
    const urlParams = new URLSearchParams(client?.['ws']?.url);
    const isTokenValid = urlParams.get('token');

    console.log('Identity:', identity?.toHexString())
    
    // A more official way to do this would be nice
    if(initToken && !isTokenValid) {
      // Init token set, but determined incorrect on connect
      console.warn('Invalid Token: ', client.token)

      FIX : {
        // clear
        localStorage.removeItem('stdb_auth_token');
        localStorage.removeItem('stdb_auth_identity');
        ([window.global_token,window.global_identity] = [undefined, undefined]);
        delete client.token
      
        // Just Reconnect: (doesn't work)
        /* client.connect().then(()=>{
          console.log('reconnect')
        }) */

        // Disconnect + Reconnect: (doesn't work)
        /* client.disconnect()
        setTimeout(()=>client.connect('ws://localhost:4000', 'project', undefined).then(()=>{
          console.log('attempt reconnect')
          client.subscribe([
            "SELECT * FROM User",
            "SELECT * FROM Message"
          ])
        }), 2e3) */

        // Just Updating Client Properties:
        /* client.token = await gen_token();
        client.identity = extract_id(client.token!);
        client['runtime'].auth_token = client.token!;
        ([window.global_token,window.global_identity] = [client.token, client.identity]);

        // console.log(client.token)
        // let res = await fetch(`http://localhost:4000/identity/websocket_token`, {
        //   "headers": {
        //     "authorization": `Basic ${btoa('token:'+client.token)}`,
        //   },
        //   "method": "POST"
        // });
        // console.log(await res.json())

        setTimeout(()=>client.connect('ws://localhost:4000', 'project', client.token).then(()=>{
          console.log(`reconnect - I don't know that this actually does anything`)
          client.subscribe([
            "SELECT * FROM User",
            "SELECT * FROM Message"
          ])
        }), 1e3) */
        // Note: Self will be unknown as new ID's are added by connect reducer... which we can't redo this way

        // Reload to get fresh token
        // (This causes infinite loop given we hard code bad token)
        // location.reload()


        client.disconnect()
        client.live = false   // allows connect to run again
        initToken = undefined // to pretend as though we never had a token
        client.connect('ws://localhost:4000', 'project', undefined)
      }

      return
    } else {
      // Init token was valid or granted new token
      console.log('Connected Successfully!');

      ([window.global_token,window.global_identity] = [token, identity]);
      localStorage.setItem('stdb_auth_token', token)
      localStorage.setItem('stdb_auth_identity', identity.toHexString())

      client.subscribe([
        "SELECT * FROM User",
        "SELECT * FROM Message"
      ])
    }
  })
  
  client.onError((err:Error)=>{
    console.log('caught1', err)
  })
  
  client.connect().catch((err:Error)=>{
    console.log('caught2', err)
  })
}


async function gen_token() {
  let tokenUrl = new URL('identity', 'http://localhost:4000')
  const response = await fetch(tokenUrl, { method: "POST" });
  let token = response.ok ? (await response.json()).token : ''
  return token ||undefined
}

function extract_id(token: string) {
  return new Identity(JSON.parse(atob(token.split('.')[1]!)).hex_identity)
}