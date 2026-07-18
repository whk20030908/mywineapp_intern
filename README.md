# MyWineApp Intern

An interactive global wine discovery prototype built around two connected paths:

- **Region → Winery → Wine → Grape**
- **Grape → Region → Winery → Wine**

The prototype includes data-led wine rankings, region and grape cross-navigation, winery listings, and conservative map-match labels.

## Live site

After GitHub Pages finishes publishing:

https://whk20030908.github.io/mywineapp_intern/

## Prototype scope

- 100 wines
- 17 countries
- 77 wine regions
- 78 grape varieties
- 1,000 ratings

This is a validation slice rather than the final global database. The interface is structured so the full dataset can be added later.

## Data sources

- X-Wines: wine, region, grape, winery and rating relationships
- Winery Map: independently verified winery coordinates where a conservative name-and-country match is available

## Run locally

Open `site/index.html` in a browser, or serve the `site` folder with any simple static web server.


## Deployment

The static site is published automatically through GitHub Actions and GitHub Pages.
