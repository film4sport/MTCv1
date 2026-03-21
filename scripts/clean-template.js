const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '..', 'public', 'mobile-app', 'index.template.html');

let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');

function extractTagById(content, id) {
  const startTag = `<div class="screen" id="${id}"`;
  const startIndex = content.indexOf(startTag);
  if (startIndex === -1) return null;

  let depth = 0;
  let i = startIndex;
  while (i < content.length) {
    if (content.substring(i, i + 4) === '<div') {
      depth++;
      i += 4;
    } else if (content.substring(i, i + 5) === '</div') {
      depth--;
      i += 5;
      if (depth === 0) {
        // Find the closing '>'
        const closeIndex = content.indexOf('>', i);
        return {
          start: startIndex,
          end: closeIndex + 1,
          content: content.substring(startIndex, closeIndex + 1)
        };
      }
    } else {
      i++;
    }
  }
  return null;
}

function extractModalById(content, id) {
  const startTag = `<div class="modal" id="${id}"`;
  const startIndex = content.indexOf(startTag);
  if (startIndex === -1) return null;

  let depth = 0;
  let i = startIndex;
  while (i < content.length) {
    if (content.substring(i, i + 4) === '<div') {
      depth++;
      i += 4;
    } else if (content.substring(i, i + 5) === '</div') {
      depth--;
      i += 5;
      if (depth === 0) {
        const closeIndex = content.indexOf('>', i);
        return {
          start: startIndex,
          end: closeIndex + 1,
          content: content.substring(startIndex, closeIndex + 1)
        };
      }
    } else {
      i++;
    }
  }
  return null;
}

const screens = [
  'screen-home', 'screen-notifications', 'screen-book', 'screen-partners',
  'screen-schedule', 'screen-search', 'screen-events', 'screen-lessons',
  'screen-settings', 'screen-captain', 'screen-admin', 'screen-messages',
  'screen-conversation'
];

screens.forEach(id => {
  const result = extractTagById(html, id);
  if (result) {
    const name = id.replace('screen-', '');
    html = html.substring(0, result.start) + `<!-- [[COMPONENT:${name}]] -->` + html.substring(result.end);
  }
});

// Modals are harder because IDs vary, but we'll try common ones
const modalIds = [
  'bookingModal', 'modifyModal', 'cancelModal', 'successModal', 'confirmModal',
  'avatarPickerModal', 'addFamilyMemberModal', 'postPartnerModal', 'newMessageModal'
];

modalIds.forEach(id => {
  const result = extractModalById(html, id);
  if (result) {
    const name = 'modal-' + id.replace('Modal', '').toLowerCase();
    html = html.substring(0, result.start) + `<!-- [[COMPONENT:${name}]] -->` + html.substring(result.end);
  }
});

fs.writeFileSync(TEMPLATE_PATH, html);
console.log('Template cleaned successfully.');
