import { SpacetimeDBClient } from "@clockworklabs/spacetimedb-sdk/dist";
declare var window: Window & {global_token:any, global_identity:any}


export default function (client:SpacetimeDBClient) {
  client.onConnect((token, identity)=>{
    /*
      400 bad request on identity/websocket_token 
      - still runs onConnect
      - client is still live
      - not detected by client.onError
      - not detected by client.connect().catch
  
      If we can't detect this error, its hard to determine
      of a client has a bad token and needs to reconnect.
    */
    console.log('Token', token);
    console.log('Live status:', client.live);

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
  
  client.connect().catch((err:Error)=>{
    // can catch bad address
    console.log('caught2', err)
  })
}