export default function openSocket() {
  console.info("Socket opened")
  const socket = new WebSocket(`ws://${window.location.host}`);
  socket.addEventListener('open', () => {
    socket.send('opened')
  });


  socket.addEventListener("close", () => {
    console.info("Socket closed")
    socket.close()
    setTimeout(() => {
      console.info("socket closed refresh")
      location.reload()

    }, 1000)
  })

  function isOpen() {
    return socket.readyState === 1
  }

  socket.addEventListener('message', e => {
    if (!isOpen()) return

    // Every "a target changed" message is the same shape: the target
    // itself (see TargetOutput in votive/lib/createDatabase.js), not a
    // bespoke per-content-type envelope - a plugin that wants to mutate
    // what's served does that via handlePreviewRequest, not by inventing
    // its own message shape here.
    const target = JSON.parse(e.data)

    // Nothing here knows what a non-html target should do on change yet -
    // that's each content type's own concern to add, same as html's own
    // diff/patch logic below isn't generic.
    if (target.extension !== ".html") return

    const regex = new RegExp(window.location.pathname + "(index)?(\\.html)")
    if (!("/" + target.path).match(regex)) return

    if (!target.data) {
      location.reload()
      return
    }

    const parser = new DOMParser()
    const oldHead = parser.parseFromString(document.documentElement.outerHTML, "text/html").head.innerHTML
    const newHead = parser.parseFromString(target.data, "text/html").head.innerHTML

    if (oldHead !== newHead) {
      location.reload()
    } else {
      const body = document.querySelector("body")
      const newBody = document.createElement("body")
      const content = target.data.match(/<body.*?>([\s\S]*)/)
      newBody.innerHTML = content[1]
      body.replaceWith(newBody)
    }
  });
}