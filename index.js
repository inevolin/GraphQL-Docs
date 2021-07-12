const fetch = require(`node-fetch`)
const fs = require(`fs-extra`)
const path = require(`path`)
const mkdirp = require(`mkdirp`)
const graphql = require(`graphql`)
const { getIntrospectionQuery } = require(`graphql`)
const { buildClientSchema } = require(`graphql`)
const { printSchema } = require(`graphql`)
const YAML = require('json-to-pretty-yaml');

async function getRemoteSchema() {
  const endpoint = `https://api.spacex.land/graphql/`
  const headers = {
    'Content-Type': `application/json`,
    // 'Authorization': ``, 
    // 'AuthorizationSource': ``,
  }
  try {
    const { data, errors } = await fetch(endpoint, {
      method: `POST`,
      headers: headers,
      body: JSON.stringify({ query: getIntrospectionQuery() }),
    }).then(res => res.json())

    if (errors)
      return { status: `err`, message: JSON.stringify(errors, null, 2) };

    if (1) {
      return JSON.stringify(data, null, 2)
    } else {
      const schema = buildClientSchema(data)
      return printSchema(schema)
    }
  } catch (err) {
    return { status: `err`, message: err.message }
  }
}

// delete entire docs folder
function cleanup() {
  try {
    fs.rmSync('./docs/', { recursive: true });
  } catch(e) {
    if (e.code !== 'ENOENT')
      console.error(e)
  }
  
}

// prep docs
async function make() {
  fs.mkdirSync(`./docs/`)
  fs.writeFileSync(`./docs/README.md`, `# Docs Demo`)
  fs.mkdirSync(`./docs/Getting Started/`)
}

// make category and add objects
//  for demo purposes to selectively categorize/label objects based on names.
function mkCategory(input, name) {
  arr = input.filter(i=>i.name.toLowerCase().includes(name.toLowerCase()))
  
  fs.mkdirSync(`./docs/${name}/`)
  fs.mkdirSync(`./docs/${name}/Objects/`)
  fs.mkdirSync(`./docs/${name}/Mutations/`)

  fs.writeFileSync(`./docs/${name}/README.md`, `# ${name}`)
  fs.writeFileSync(`./docs/${name}/Objects/README.md`, `# ${name} Objects`)
  fs.writeFileSync(`./docs/${name}/Mutations/README.md`, `# ${name} Mutations`)

  for (const a of arr) {
    if (a.kind===`OBJECT`) {
      fs.writeFileSync(`./docs/${name}/Objects/`+a.name+`.md`, getBody_OBJECTS(a))
      a._used = name // mark object as labeled
      a._kind = 'Objects'
    }
    else if (a.kind===`INPUT_OBJECT`) {
      fs.writeFileSync(`./docs/${name}/Mutations/`+a.name+`.md`, getBody_OBJECTS(a))
      a._used = name // mark object as labeled
      a._kind = 'Mutations'
    }
    else
      console.log(a.kind)

    // todo: SCALAR
    // todo: ENUM
  }
}

// auto-generated body content for each object
function getBody_OBJECTS(a) {
  let ret = '';

  // title & subtitle
  ret += `# ` + a.name + '\n';
  ret += (a.description ?`\n## `+a.description:'' );
  
  // code snippet
  let code = `type ${a.name} {\n\n`;
  let params = a.fields || a.inputFields;
  if (params)
    for (const arg of params) {
      if (arg.description) 
        code +=`  # ${arg.description}\n`
      let non_null = false;
      let is_list = false;
      let type = arg.type;
      if (type.kind === 'NON_NULL') non_null = true;
      if (type.kind === 'LIST') is_list = true;
      while (type.ofType) {
        type = type.ofType;
        if (type.kind === 'NON_NULL') non_null = true;
        if (type.kind === 'LIST') is_list = true;
      }
      let aname = `${type.name}`;
      let argtype = `${aname}${non_null? '!':''}`
      if (is_list) {
        argtype = `[${argtype}]${non_null? '!':''}`
      }
      code +=`  ${arg.name}: ${argtype}\n\n`
    }
  code +='}';
  ret += "\n\n```graphql\n" + code + "\n```\n"


  // inject custom markdown here...


  if (fs.existsSync(`./placeholders/${a.name}.md`)) {
    ret += '\n' + fs.readFileSync(`./placeholders/${a.name}.md`)
  }

  return ret;
}

const merge = require('deepmerge')

// generate YAML for mkdocs (nav structure, options, etc.)
function genMkdocsYaml(types) {
  let map = {
    site_name: 'My Docs',
    site_url: 'https://example.com/',
    nav: {}, // should be array, but keep as object so we can merge
    theme: {
      name: 'material',
      features: [
        // 'navigation.tabs'
      ]
    },
    plugins: [
      {'search':''}
    ],
    markdown_extensions: {
      toc: {baselevel: 0},
    },
    extra_css: ['./extra/highlight.css', './extra/custom.css'],
    extra_javascript: [
      './extra/jquery.js',
      './extra/highlight.js',
      './extra/highlightjs-line-numbers.js',
      './extra/graphql.js',
      './extra/init.js',
    ],
  }
  let refs = {}
  for (const a of types) {
    let category = a._used;
    if (category) {
      if (!refs[category])
        refs[category] = {}
      if (!refs[category][a._kind])
        refs[category][a._kind] = {}

      refs[category][a._kind][a.name] = `./${category}/${a._kind}/${a.name}.md`;
    }
  }
  map.nav['GraphQL reference']= refs;
  console.log("Used labels:", Object.keys(refs).join(', '))

  //////////////////
  // custom pages //
  /////////////////
  const pages = dirTree('./pages')["pages"];
  // copy custom pages into docs
  fs.copySync('./pages', './docs')
  // copy extra css/js files
  fs.copySync('./extra', './docs/extra')
  // merge custom pages into navigation
  map.nav = merge(map.nav, pages) 
  // transform object to array structure for YAML generation
  map.nav = Object.keys(map.nav).map(key => {let ret = {}; ret[key]=map.nav[key]; return ret;})

  // write YAML
  fs.writeFileSync('./mkdocs.yml', YAML.stringify(map))
}

function dirTree(filename) {
    let stats = fs.lstatSync(filename);
    let info = {};
    let key = path.basename(filename).split('.')[0];
    info = {}
    if (stats.isDirectory()) {
      info[key] = {}
      info[key] = fs.readdirSync(filename).map(function(child) {
          return dirTree(filename + '/' + child);
      })
      if (info[key].length)
        info[key]=info[key].reduce((map, obj) => {
          map[Object.keys(obj)[0]] = Object.values(obj)[0]
          return map
        });
    } else {
      info[key] = filename.replace('./pages/', './')
    }
    return info;
}
 
// entry point:
(async () => {

  await cleanup();
  await make();

  // GET SCHEMA
  
  //console.log('Note: use the dump.json method instead of making API calls during development!\n')
  let raw = await getRemoteSchema();
  raw = JSON.parse(raw)
  fs.writeFileSync('./dump.json', JSON.stringify(raw,0,2));
  const schema = require(`./dump.json`)[`__schema`]
  //const schema = JSON.parse(await getRemoteSchema())['__schema']

  // PREP WORK
  const types = schema[`types`]
  types.forEach(x => x['_used'] = null); // keep track of (un)used objs
  console.log(new Set(types.map(x => x.kind)))
  let arr= []

  // (temporary) make labels/categories based on substrings in property names
  mkCategory(types, `users`)
  mkCategory(types, `launch`)
  mkCategory(types, `capsule`)
  mkCategory(types, `rocket`)
  mkCategory(types, `mission`)


  // list of all 'todo' objects (which don't belong to any category):
  console.log("Unlabeled objects:", types.filter(x => x._used === null).map(x=>x.name).length, "of", types.length)

  genMkdocsYaml(types)
})();
