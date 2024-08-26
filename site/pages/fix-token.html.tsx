import { Html } from "../html.js";


export default <Html>
  <script type='module' src='../index.js' />
  <a href="/">{'<-- Go Back'}</a>
  <h2>Fix-Token</h2>
  <p>
    This page ensures you connect with a bad token.<br/>
    However, it tries to fix the issue after detection by reconnecting.<br/>
  </p>
  <div id="app"> Connecting...</div>
  <br/>
</Html>
