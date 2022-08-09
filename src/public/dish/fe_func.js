class Dish {

    // ratios
    _ratios = ['4:3', '16:9', '1:1', '1:2']

    // default options
    _dish = false
    _conference = false
    _cameras = 0
    _margin = 10
    _aspect = 0
    _video = false;
    _ratio = this.ratio() // to perfomance call here
    _participantList = [];

    // create dish
    constructor(scenary) {

        // parent space to render dish
        this._scenary = scenary

        // create the conference and dish
        this.create()

        // render cameras
        // this.render()

        return this;
    }

    // create Dish
    create() {

        // create conference (dish and screen container)
        this._conference = document.createElement('div');
        this._conference.classList.add('Conference');

        // create dish (cameras container)
        this._dish = document.createElement('div');
        this._dish.classList.add('Dish');

        // append dish to conference
        this._conference.appendChild(this._dish);

    }

    // set dish in scenary
    append() {

        // append to scenary
        this._scenary.appendChild(this._conference);

    }

    // calculate dimensions
    dimensions() {
        this._width = this._dish.offsetWidth - (this._margin * 2);
        this._height = this._dish.offsetHeight - (this._margin * 2);
    }

    // // render cameras of dish
    // render() {

    //     // delete cameras (only those that are left over)
    //     // if (this._dish.children) {
    //     //     for (let i = this._cameras; i < this._dish.children.length; i++) {
    //     //         let Camera = this._dish.children[i]
    //     //         this._dish.removeChild(Camera);
    //     //     }
    //     // }

    //     // add cameras (only the necessary ones)
    //     for (let i = this._dish.children.length; i < this._cameras; i++) {
    //         let Camera = document.createElement('div')
    //         this._dish.appendChild(Camera);
    //     }

    // }

    // resizer of cameras
    resizer(width) {

        for (var s = 0; s < this._dish.children.length; s++) {

            // camera fron dish (div without class)
            let element = this._dish.children[s];

            // custom margin
            element.style.margin = this._margin + "px"

            // calculate dimensions
            element.style.width = width + "px"
            element.style.height = (width * this._ratio) + "px"

            // to show the aspect ratio in demo (optional)
            element.setAttribute('data-aspect', this._participantList[s].name);

        }
    }

    resize() {

        // get dimensions of dish
        this.dimensions()

        // loop (i recommend you optimize this)
        let max = 0
        let i = 1
        while (i < 5000) {
            let area = this.area(i);
            if (area === false) {
                max = i - 1;
                break;
            }
            i++;
        }

        // remove margins
        max = max - (this._margin * 2);

        // set dimensions to all cameras
        this.resizer(max);
    }

    // split aspect ratio (format n:n)
    ratio() {
        var ratio = this._ratios[this._aspect].split(":");
        return ratio[1] / ratio[0];
    }

    // calculate area of dish:
    area(increment) {

        let i = 0;
        let w = 0;
        let h = increment * this._ratio + (this._margin * 2);
        while (i < (this._dish.children.length)) {
            if ((w + increment) > this._width) {
                w = 0;
                h = h + (increment * this._ratio) + (this._margin * 2);
            }
            w = w + increment + (this._margin * 2);
            i++;
        }
        if (h > this._height || increment > this._width) return false;
        else return increment;

    }

    join(pid, name) {
        this._participantList.push({
            id: pid,
            name: name
        });
        this._cameras++;
        // this.render();
        let cameraDiv = document.createElement('div')
        cameraDiv.setAttribute('id', `participant-${pid}`);
        this._dish.appendChild(cameraDiv);
        this.resize();
        this.video(this._participantList.length - 1);
    }

    left(pid) {
        let participantDiv = this._dish.querySelector(`#participant-${pid}`);
        participantDiv.remove();
        for( var i = 0; i < this._participantList.length; i ++) { 
            if ( this._participantList[i].id == pid) { 
                this._participantList.splice(i, 1); 
                break;
            }
        };
        this._cameras--;
        this.resize();
    }

    // // add new camera
    // add() {
    //     this._cameras++;
    //     this.render();
    //     this.resize();
    // }

    // // remove last camera
    // delete() {
    //     this._cameras--;
    //     this.render();
    //     this.resize();
    // }

    // return ratios
    ratios() {
        return this._ratios;
    }

    // return cameras
    cameras() {
        return this._cameras;
    }

    // set ratio
    aspect(i) {
        this._aspect = i;
        this._ratio = this.ratio()
        this.resize();
    }

    // set screen scenary
    expand() {

        // detect screen exist
        let screens = this._conference.querySelector('.Screen');
        if (screens) {

            // remove screen
            this._conference.removeChild(screens);

        } else {

            // add div to scenary
            let screen = document.createElement('div');
            screen.classList.add('Screen');
            // append first to scenary
            this._conference.prepend(screen);

        }
        this.resize();
    }

    video(camera, callback, hide = false) {
        console.log("CAMERA ++++++++++");
        console.log(camera);
        console.log(this._participantList[camera]);
        // check have video
        if (this._dish.children[camera].video) {
            if (hide) {
                // delete video:
                this._dish.children[camera].video = false
                let videos = this._dish.children[camera].querySelectorAll('video');
                this._dish.children[camera].removeChild(videos[0]);
            }
        } else {
            // set video
            this._dish.children[camera].video = true

            let id = this._participantList[camera].id;
            let name = this._participantList[camera].name;

            
            let video = document.createElement('video');
            video.setAttribute('id', `participant-${id}-video`)
            video.poster = '../images/person-icon-12.jpg'
            video.autoplay = true;
            video.muted = true;
            video.playsinline = true;
            video.controls = true;

            let audio = document.createElement('audio');
            audio.setAttribute('id', `participant-${id}-audio`)
            audio.autoplay = true;
            audio.playsinline = true;

            this._dish.children[camera].append(video, audio);
        }

    }

    // playAll(delay = 0, hide = false) {
    //     let cameras = this._cameras;
    //     let i = 0;
    //     while (i < cameras) {
    //         this.video(i);
    //         i++;
    //     }
    // }


}