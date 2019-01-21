const client_id = '40415692196-d2gldqeetn75lbq8ba7pfhqqjq0iju4f.apps.googleusercontent.com';
const api_Key = 'KOAwGZ3B6-J6ynL1VtnkJfkM';
const scopes = 'https://www.googleapis.com/auth/gmail.readonly';

function handleClientStart() {
  gapi.client.setApiKey(api_Key);
  window.setTimeout(checkAuth, 1);
}

function checkAuth() {
  gapi.auth.authorize({
    client_id: client_id,
    scope: scopes,
    immediate: true,
  }, handleAuthResult);
}

function handleAuthClick() {
  gapi.auth.authorize({
    client_id: client_id,
    scope: scopes,
    immediate: false,
  }, handleAuthResult);
  return false;
}

function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    initGmailApi();
    $('#text-warnning').text('Autenticando...');
    $('#authorize-button').remove();
    $('.table-inbox').removeClass('hidden');
  } else {
    $('#authorize-button').removeClass('hidden');
    $('#authorize-button').on('click', () => {
            handleAuthClick();
            $('#text-warnning').text(authResult.error);
          });
  }
}

function initGmailApi() {
  gapi.client.load('gmail', 'v1', showInbox);
}

function showInbox() {
  let request = gapi.client.gmail.users.messages.list({
    userId: 'me',
    labelIds: 'INBOX',
    maxResults: 10,
  });

  request.execute((response) => {
          $.each(response.messages, function() {
            var message_request = gapi.client.gmail.users.messages.get({
              'userId': 'me',
              'id': this.id,
            });

            message_request.execute(appendMessage);
          });
        });
}

function appendMessage(message) {
  $('.table-inbox tbody').append(`<tr>\
            <td>${getHeader(message.payload.headers, 'From')}</td>\
            <td>\
              <a href="#message-modal-${  message.id
                }" data-toggle="modal" id="message-link-${  message.id}">${
                getHeader(message.payload.headers, 'Subject')
              }</a>\
            </td>\
            <td>${getHeader(message.payload.headers, 'Date')}</td>\
          </tr>`,);

  $('body').append(`<div class="modal fade" id="message-modal-${  message.id
              }" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">\
            <div class="modal-dialog modal-lg">\
              <div class="modal-content">\
                <div class="modal-header">\
                  <button type="button"\
                          class="close"\
                          data-dismiss="modal"\
                          aria-label="Close">\
                    <span aria-hidden="true">&times;</span></button>\
                  <h4 class="modal-title" id="myModalLabel">${
                    getHeader(message.payload.headers, 'Subject')
                  }</h4>\
                </div>\
                <div class="modal-body">\
                  <iframe id="message-iframe-${message.id}" srcdoc="<p>Loading...</p>">\
                  </iframe>\
                </div>\
              </div>\
            </div>\
          </div>`,);

  $(`#message-link-${message.id}`).on('click', () => {
          var ifrm = $('#message-iframe-'+message.id)[0].contentWindow.document;
          $('body', ifrm).html(getBody(message.payload));
        });
}

function getHeader(headers, index) {
  let header = '';

  $.each(headers, function () {
    if (this.name === index) {
      header = this.value;
    }
  });
  return header;
}

function getBody(message) {
  let encodedBody = '';
  if (typeof message.parts === 'undefined') {
    encodedBody = message.body.data;
  } else {
    encodedBody = getHTMLPart(message.parts);
  }
  encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  return decodeURIComponent(escape(window.atob(encodedBody)));
}

function getHTMLPart(arr) {
  for (let x = 0; x <= arr.length; x++) {
    if (typeof arr[x].parts === 'undefined') {
      if (arr[x].mimeType === 'text/html') {
        return arr[x].body.data;
      }
    } else {
      return getHTMLPart(arr[x].parts);
    }
  }
  return '';
}
