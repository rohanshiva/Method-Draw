(function () {
    const open = async () => {
        const filename = window.deta.toOpen.innerText;
        const response = await window.api.app.loadDrawing(filename);
        if (response.status === 200) {
            const bod = response.body;
            const stream = new Response(bod);
            const file = await stream.blob();
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function () {
                svgCanvas.setSvgString(JSON.parse(reader.result));
            };
            reader.onerror = function () {
                console.log(reader.error);
            };
        } else {

        }
        console.log(response);
        /*
          .then((res) => res.body)
          .then((stream) => new Response(stream))
          .then((response) => response.blob())
          .then((file) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function () {
              svgCanvas.setSvgString(JSON.parse(reader.result));
              editor.save_name = name;
              document.getElementById("save_name").innerText = name;
              document
                .getElementById("tool_csave")
                .classList.remove("disabled");
              document.getElementById("tool_cdel").classList.remove("disabled");
              window.api.app.load_drawing_metadata(name).then((res) => {
                document.getElementById("public_toggle").checked =
                  res["public"];
                if (document.getElementById("public_toggle").checked){
                    document.getElementById("share_links").style.display = "block";
                    document.getElementById("raw_url").value = `${window.location.hostname}/public/raw/${editor.save_name}`
                    document.getElementById("edit_url").value = `${window.location.hostname}/public/?name=${editor.save_name}`
                    document.getElementById("share_desc").innerHTML =
                    "Anyone with the link can view your work.";
                } else {
                    document.getElementById("share_desc").innerHTML =
                    "Make your drawing public and share a link with anyone";
                    document.getElementById("share_links").style.display = "none";
                }
              });
            };
            reader.onerror = function () {
              console.log(reader.error);
            };
          });
          */
    }

    const close = () => {

    };

    window.deta = {
        toOpen: null,
        currOpen: null,
        open,
        close,
    }
})();