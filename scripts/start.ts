import { spawn, execSync, } from 'child_process'

console.log('Starting STDB...')


let port = 4000

/***   SET-SERVER   ***/
try {
  execSync(`stdb server add http://localhost:${port} "localhost:${port}" -d --no-fingerprint`)
} catch (err:any) {
  console.log(err.toString())
}
try {
  execSync(`stdb server set-default --server http://localhost:${port}`)
} catch (err:any) {
  console.log(err.toString())
}



/***   START   ***/
let [skippedOut, skippedErr] = [false, false]
const proc = spawn('stdb', ['start', ".spacetime", `-l=localhost:${port}`]);
proc.stdout.on('data', (t)=>{
  // Skip first message (its a default message)
  if (skippedOut) console.log(t.toString());
  else {
    let m = t.toString().match(/spacetime.*\n/g)
    m && console.log(m?.flat()?.join(''))
    skippedOut=true
  }
})
proc.stderr.on('data', (t)=>{
  // Skip first error (its a default message)
  let err = t.toString()
  // catching the error is iffy with standard spawn...
  if (skippedErr || !/^\n?(error|note|warning):/.test(err) ) {
  } else skippedErr=true
})



/***   PUBLISH   ***/
if (process.argv.includes('publish')) {
  setTimeout(()=>{
    console.log('Publishing... (this may take a while)')
    const proc = spawn('stdb', ['publish', '--project-path=./server', "project"]);
    proc.stdout.on('data', (t)=>{
      console.log(t.toString());
    })
    proc.stderr.on('data', (t)=>{
      console.log(t.toString());
    })
    proc.on('close', () => {
      execSync('npm run stdb:gen')
      run_client()
    });
  }, 1e3)
} else {
  run_client()
}

function run_client () {
  setTimeout(()=>{
    const proc = spawn('imlib', ['dev']);
    proc.stdout.on('data', (t)=>{
      console.log(t.toString());
    })
    proc.stderr.on('data', (t)=>{
      console.log(t.toString());
    })
  }, 1e3)
}