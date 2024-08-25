import { Html } from "../html.js";


export default <Html>
  <script type='module' src='../index.js' />
  <a href="/">{'<-- Go Back'}</a>
  <h2>Fix-Token</h2>
  <p>
    This page ensures you connect with a bad token.<br/>
    However, it tries to fix the issue after detection.<br/>
    This should connect for ~1 sec, then load in data.<br/>
    {`(I don't actually know how to handle correcting the token)`}<br/>
    {`(Note: Self is unknown as new ID's are added on connect... which we can't redo)`}
  </p>
  <div id="app"> Connecting...</div>
  <br/>
</Html>
