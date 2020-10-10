# @podlove/source-publisher

> Gridsome Source for Podlove Publisher

## Installation

1. Install the package

> npm i @podlove/source-publisher --save-dev

2. Add the source to `gridsome.config.js` plugins

```javascript
{
  use: '@podlove/source-publisher',
  options: {
    baseUrl: 'https://poblisher.com', // required
    apiBase: 'wp-json', // optional
    typeName: 'Podlove' // optional
  }
}
```
