import { Html } from "../html.js";


export default <Html>
  <script type='module' src='../index.js' />
  <a href="/">{'<-- Go Back'}</a>
  <h2>Pre-Catch</h2>
  <p>
    This page ensures you connect with a bad token.<br/>
    However, it runs its own fetch that we can catch to check for bad tokens.<br/>
    This page should be stuck "Connecting..." and have a warning in the console.
  </p>
  <div id="app"> Connecting...</div>
  <br/>
</Html>
2