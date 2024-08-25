import { SpacetimeDBClient } from "@clockworklabs/spacetimedb-sdk/dist";
declare var window: Window & {global_token:any, global_identity:any}


export async function safeConnect(client:SpacetimeDBClient, token:string|undefined) {
  let address = 'http://localhost:4000'

  if (client.live) return console.log('Client already connected.')
  try {
    let res = await fetch(`${address}/identity/websocket_token`, {
      "headers": {
        "authorization": `Basic ${btoa('token:'+token)}`,
      },
      "method": "POST"
    });
    if (res.status === 200) {
      return client.connect() // connect with token
    }
  } catch(err) {
    // console.log(err as Error)
  }
  console.warn('Invalid Token: ', token)
  localStorage.removeItem('stdb_auth_token')
  //client.connect() // connect anonymously
}

export default function (client:SpacetimeDBClient) {
  client.onConnect((token, identity)=>{
    ([window.global_token, window.global_identity]  = [token, identity]);
    localStorage.setItem('stdb_auth_token', token)
    localStorage.setItem('stdb_auth_identity', identity.toHexString())
  
    client.subscribe([
      "SELECT * FROM User",
      "SELECT * FROM Message"
    ])
  })
  
  client.onError((err:Error)=>{
    console.log('caught1', err)
  })
  
  safeConnect(client, window.global_token)
}