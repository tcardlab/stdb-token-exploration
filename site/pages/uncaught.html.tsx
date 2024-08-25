import { Html } from "../html.js";


export default <Html>
  <script type='module' src='../index.js' />
  <a href="/">{'<-- Go Back'}</a>
  <h2>Uncaught</h2>
  <p>
    This page ensures you connect with a bad token.<br/>
    There is no detection nor error handling in place.<br/>
    The subscription goes through and the client retains a bad token.<br/>
    You should see a bad fetch request in the console {'(notably this error goes uncaught by the error handling methods we have available)'}.
  </p>
  <div id="app"> Connecting...</div>
  <br/>
</Html>
