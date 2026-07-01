const fs = require('fs');
let css = fs.readFileSync('src/components/dashboard/dhd.css', 'utf8');

css = css.replace('font-size: 32px;\n  font-weight: 700;', 'font-size: 24px;\n  font-weight: 600;');
css = css.replace('width: 44px;\n  height: 44px;', 'width: 32px;\n  height: 32px;');
css = css.replace('align-items: stretch;', 'align-items: start;');
css = css.replace('border-radius: 32px;\n  padding: 28px 32px 24px;', 'border-radius: 24px;\n  padding: 22px 24px 20px;');
css = css.replace('height: 100%;\n  min-height: 340px;', 'height: auto;\n  min-height: 290px;');
css = css.replace('padding: 14px 20px;\n  border-radius: 9999px;\n  background: #F8FAFC;', 'padding: 10px 12px;\n  border-radius: 12px;\n  background: transparent;');
css = css.replace('margin-bottom: 8px;', ''); // remove margin
css = css.replace('font-size: 22px;', 'font-size: 18px;');

css = css.replace('border-radius: 9999px;\n  padding: 16px 24px;', 'border-radius: 16px;\n  padding: 16px;');
css = css.replace('border-radius: 32px;\n  padding: 24px;', 'border-radius: 20px;\n  padding: 20px;');

fs.writeFileSync('src/components/dashboard/dhd.css', css);
console.log('Reverted layout sizing in CSS');
