import 'jquery-confirm';

const confirmDialog = (content, okCallback, cancelCallback) => {
  if (okCallback === null) {
    okCallback = () => {
      console.log("Default okCallback");
    };
  }
  if (cancelCallback === null) {
    cancelCallback = () => {
      console.log("Default cancelCallback");
    };
  }

  $.confirm({
    title: "Caution",
    content: content,
    type: 'green',
    buttons: {
      ok: {
        text: 'Yes',
        btnClass: 'btn-primary',
        keys: ['enter'],
        action: okCallback
      },
      cancel: {
        text: 'No',
        btnClass: 'btn-default',
        action: cancelCallback
      }
    }
  });
}


export default confirmDialog;
