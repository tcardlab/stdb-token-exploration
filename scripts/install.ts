import fs from 'fs';
import path from 'path'
import { download_asset } from './dl_progress'
import { execSync } from 'child_process'

interface Release {
  tag_name: string;
  assets: {
      name: string;
      browser_download_url: string;
  }[];
}

/***   CONSTANTS   ***/
const STDB_VER = process.argv.pop()! // '0.10.0'
if (!isValidVersion(STDB_VER)) throw new Error('Please provide a valid version (ex: 0.10.0).')

const STDB_EXE_PATH = './.spacetime/'
const owner = 'clockworklabs'
const repo = 'SpacetimeDB'
let STDB = STDB_EXE_PATH ? path.join(STDB_EXE_PATH,'spacetime') : 'spacetime'

let asset_map: Record<string, string> = {
  'win32_*'     :  'spacetime.exe'                ,
  'linux_x64'   :  'spacetime.linux-amd64.tar.gz' ,
  'linux_arm64' :  'spacetime.linux-arm64.tar.gz' ,
  'darwin_x64'  :  'spacetime.darwin-amd64.tar.gz',
  'darwin_arm64':  'spacetime.darwin-arm64.tar.gz',
}

/***   MAIN   ***/
async function INSTALL_STDB_EXE () {  
  let release = await getGivenVersion(STDB_VER)

  let current_version
  try {
    current_version = await getCurrentVersion()
  } catch {
    console.log('Current STDB version not detected.')
    clear_priors()
    await downloadRelease(release)
    return
  };
  
  let cleaned_version;
  let match = STDB_VER.match(/(\d+\.\d+\.\d+)/)
  if (match && match[1]) {
    cleaned_version = match[1];
    
    if (current_version === cleaned_version) {
      console.log(`STDB Version ${current_version} already installed.`)
      return
    }
  }

  clear_priors()
  await downloadRelease(release)
}
INSTALL_STDB_EXE()



/***   HELPERS   ***/
async function getRemoteVersions() {
  let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`)
  if (!res.ok) throw new Error(`Releases Fetch Failed: ${res.status} - ${res.statusText}`)
  return (await res.json()) as Release[]
}

function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

export async function getGivenVersion(version:string) {
  if (isValidVersion(version)) {
    let version_list = await getRemoteVersions()
    let match_version = new RegExp(`^v${version}`)
    let release = version_list.find(v => match_version.test(v.tag_name))
    
    if (release) return release
  } 

  throw new Error(`Version "${version}" could not be found`)
}

function getArch(): string[] {
  const platform = process.platform;
  const architecture = process.arch;
  return [
    platform, 
    platform === 'win32' ? '*' : architecture
  ]
}

function get_asset_name() {
  let arch:string = getArch().join('_')
  if (arch in asset_map) {
    return asset_map[arch]
  }
  throw new Error(`Arch not recognized ${arch}`)
}


async function getCurrentVersion() {
  let res:string;
  try {
    res = execSync(`${STDB} version`).toString()
  } catch (err:any) {
    //console.error(`Version command Failed: ${err.toString()}`)
    throw new Error(`Version command Failed: ${err.toString()}`)
  }

  let match = res.match(/version (\d+\.\d+\.\d+)/)
  if (match && match[1]) {
    const version = match[1];
    return version
  } else {
    let err_msg = `Version not found in response: ${res}`
    console.error(err_msg)
    throw new Error(err_msg)
  }
}

async function downloadRelease(release: Release) {
  // Get OS specific asset
  let asset_name = get_asset_name()
  let asset = release.assets.find(asset => asset.name === asset_name);
  if (!asset) throw new Error(`Asset "${asset_name}" not found in the release.`);

  // Download the asset
  const downloadUrl = asset.browser_download_url;

  const destinationPath = STDB_EXE_PATH ?? './spacetime' 
  // default to local install? (ideally os specific global install, but thats annoying to code)
  console.log(`Starting ${release.tag_name} Download:`)
  // console.log(downloadUrl)
  await download_asset(downloadUrl, destinationPath);

  // Post Install:
  switch (process.platform) {
    case 'darwin':
      return execSync(`chmod +x ${destinationPath}/spacetime`)
    case 'linux':
      return execSync(`chmod +x ${destinationPath}/spacetime`)
    case 'win32':
      fs.rename(`${destinationPath}/spacetime.exe`, `${destinationPath}/spacetime`, (err) => {
        if (err) throw err;
        console.log('File renamed successfully!');
      });
      return 
    default:
      throw new Error(`Platform not recognized: ${process.platform}`)
  }
}


function deleteDirectory(dir:string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Deleted: ${dir}`);
  }
}

function clear_priors() {
  const dirsToDelete = [
    './.spacetime/control_node',
    './.spacetime/worker_node'
  ];

  for (let dir of dirsToDelete) {
    const fullPath = path.resolve(dir);
    deleteDirectory(fullPath);
  }
}