
(function () {
    const close = () => {
        if (window.deta.currOpen) {
            const currOpenNodeMenu = document.querySelector('#curr_open_drawing');
            currOpenNodeMenu.remove();
        }
        window.deta.currOpen = null;
    };

    const setOpen = (filename) => {
        // sets a recently saved file as open in the menu
        const menu = document.querySelector('#menu_bar');
        const openItem = document.createElement("div");
        openItem.setAttribute("class", "menu");
        openItem.setAttribute("id", "curr_open_drawing")
        const openItemTitle = document.createElement("strong");
        openItemTitle.setAttribute("id", "curr_open_item");
        openItemTitle.setAttribute("class", "menu_title");
        openItemTitle.innerText = filename;
        openItem.appendChild(openItemTitle);
        menu.appendChild(openItem);
        window.deta.currOpen = filename;
    }

    const setShareStatus = (public) => {
      console.log(public)
      document.getElementById("public_toggle").checked = public;
      if (public){
        document.getElementById("share_links").style.display = "block";
        document.getElementById("raw_url").value =  `${window.location.hostname}/public/raw/${window.deta.currOpen}`
        document.getElementById("edit_url").value = `${window.location.hostname}/public/?name=${window.deta.currOpen}`
        document.getElementById("share_desc").innerHTML =
          "Anyone with the link can view your work.";
      } else {
        document.getElementById("share_desc").innerHTML =
        "Make your drawing public and share a link with anyone";
        document.getElementById("share_links").style.display = "none";
      }
    }
    const open = async () => {
        const filename = window.deta.toOpen.innerText;
        const response = await window.api.app.loadDrawing(filename);
        if (response.status === 200) {
            close();
            const bod = response.body;
            const stream = new Response(bod);
            const file = await stream.blob();
            const drawing_metadata = await window.api.app.getMetadata(filename);
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function () {
                svgCanvas.setSvgString(JSON.parse(reader.result));
                // set name in the menu
                setOpen(filename);
                // set share button in the menu 
                setShareStatus(drawing_metadata["public"]);
            };
            reader.onerror = function () {
                console.log(reader.error);
            };
        } else {

        }
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

    window.deta = {
        toOpen: null,
        currOpen: null,
        setOpen,
        open,
        close,
    }
})();