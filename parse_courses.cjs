const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('scratch.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const slides = document.querySelectorAll('.swiper-slide');

const courses = [];

slides.forEach((slide, index) => {
  if (slide.classList.contains('swiper-slide') && slide.querySelector('[data-slot="card"]')) {
    const titleEl = slide.querySelector('h3');
    const title = titleEl ? titleEl.textContent : '';

    const levelEl = slide.querySelector('h5');
    const level = levelEl ? levelEl.textContent : '';

    const badgeEl = slide.querySelector('.panda-badge');
    const badge = badgeEl ? badgeEl.textContent : null;

    const imgEl = slide.querySelector('img[data-slot="img"]');
    const image = imgEl ? imgEl.src : '';

    const itemsContainers = slide.querySelectorAll('a.panda-d_flex.panda-flex-d_row');
    const items = [];

    itemsContainers.forEach(itemCont => {
      const pEl = itemCont.querySelector('p');
      const itemTitle = pEl ? pEl.textContent : '';

      // Check if it's active based on opacity class
      const active = itemCont.classList.contains('panda-op_1');

      // The first SVG in the container is the icon
      const svgs = itemCont.querySelectorAll('svg');
      let iconHTML = '';
      if (svgs.length > 0) {
        // We want the SVG outerHTML, but we need to convert to JSX later (e.g. fill-rule -> fillRule)
        iconHTML = svgs[0].outerHTML;
      }

      if (itemTitle) {
        items.push({
          title: itemTitle,
          active,
          iconHTML
        });
      }
    });

    // Level colors based on text or class
    let levelColor = '#456DFF'; // default blue
    if (levelEl && levelEl.classList.contains('panda-color-palette_purple')) levelColor = '#9D62FF';
    if (levelEl && levelEl.classList.contains('panda-color-palette_green')) levelColor = '#29CC57';

    courses.push({
      id: index + 1,
      title,
      level,
      levelColor,
      badge,
      image,
      items
    });
  }
});

fs.writeFileSync('parsed_courses.json', JSON.stringify(courses, null, 2));
console.log('Parsed successfully! Found ' + courses.length + ' courses.');
