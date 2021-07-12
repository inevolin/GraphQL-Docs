# GraphQL Generated Docs

## Requirements

 - NodeJS v12+
 - Python 3.7+ with pip
 - Install mkdocs: `pip install mkdocs`
 - Install mkdocs Material theme: `pip install mkdocs-material` [docs](https://squidfunk.github.io/mkdocs-material/customization/)
 - Test the mkdocs command: `mkdocs --version`

## Usage

  1. clone the repo
  2. run `npm install`
  3. run `npm start` or `node index.js` this will generate the `./docs/` files
  4. run `mkdocs serve` and open `localhost:8000`
  5. run `mkdocs build` to generate static html in `./site/`
  
 * Mkdocs generates important INFO logs (eg: missing important md files)
 * **Important:** during development & testing use the `dump.json` method instead of getting schema from API.

