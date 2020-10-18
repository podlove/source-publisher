# @podlove/source-publisher

> Gridsome Source for [Podlove Publisher](https://wordpress.org/plugins/podlove-podcasting-plugin-for-wordpress/)

## Requirements

- Podlove Publisher with in version 3.1 or later

## Installation

1. Install the package

> npm i @podlove/source-publisher --save-dev

2. Add the source to `gridsome.config.js` plugins

```javascript
{
  use: '@podlove/source-publisher',
  options: {
    baseUrl: 'https://publisher.com', // required
    apiBase: 'wp-json', // optional
    typeName: 'Podlove', // optional
    imageCache: 'src/assets/images' // optional
  }
}
```

## Usage

This source plugin is meant for a single Podcast show with multiple episodes.

### Static Queries

The `Show` is provided as static metadata.

_Example Usage:_

```
<static-query>
query {
  metadata {
    PodloveShow {
      title,
      subtitle,
      summary,
      poster
    }
  }
}
</static-query>
```

### Dynamic Queries

Core to this plugin is the `Episode` object that contains `Audio` files, a list of `Chapter`, `Transcript`, `Contributor` and a `Timeline`:

_Example Usage:_

```
<page-query>
query ($id: ID!) {
  podloveEpisode(id: $id) {
    id,
    path,
    title,
    summary,
    publicationDate,
    poster,
    duration,
    content,
    audio {
      url,
      size,
      title,
      mimeType
    },
    chapters {
      start,
      end,
      title,
      href,
      image
    },
    contributors {
      details {
        id,
        name
        avatar
      }
    },
    timeline {
      node,
      title,
      type,
      start,
      end,
      texts {
        start,
        end,
        text
      },
      speaker {
        avatar,
        name
      }
    }
  }
}
</page-query>
```

## Image Caching

Beside fetching the show and episode data this plugin also copies source images from the publisher for better caching. Resolved images are relative to the provided `imageCache` path. To use the images in your application a custom webpack resolver in the `gridsome.config` is recommended:

```javascript
  chainWebpack: config => {
    config.resolve.alias.set('@images', '@/assets/images')
  },
```

Finally in the component caching and resizing can be created with the `asset-loader`:

```html
<g-image v-if="poster" :src="require(`!!assets-loader?width=180&height=180!@images/${poster}`)" />
```
