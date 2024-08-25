import { SpacetimeDBClient } from "@clockworklabs/spacetimedb-sdk/dist";
declare var window: Window & {global_token:any, global_identity:any}


export default function (client:SpacetimeDBClient) {
  /* Hack:
    We can determine if a bad token was used by checking
    if the value was used in the ws connection url.
    It will not be present if it was determined invalid.
  */

  let initToken = client?.['runtime']?.auth_token
  client.onConnect((token, identity)=>{
    const urlParams = new URLSearchParams(client?.['ws']?.url);
    const isTokenValid = urlParams.get('token');
    
    // A more official way to do this would be nice
    if(initToken && !isTokenValid) {
      // Init token set, but determined incorrect on connect
      console.warn('Invalid Token: ', client.token)
      return
    } else {
      // Init token was valid or granted new token
      window.global_token = token
      window.global_identity = identity
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