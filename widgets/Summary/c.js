define(function() {
  Counter.DefaultCharacterSets = {
    numericUp: '0123456789',
    numericDown: '9876543210',
    alphabeticUp: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alphabeticDown: 'ZYXWVUTSRQPONMLKJIHGFEDCBA ',
    alphanumericUp: '0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alphanumericDown: '9876543210ZYXWVUTSRQPONMLKJIHGFEDCBA ',
    calculator: '0123456789.,+-*/= ',
    qwertyKeybord: ' QWERTYUIOPASDFGHJKLZXCVBNM1234567890-=[]\\;\',./~`!@#$%^&*()_+{}|:"<>?',
    allCharacters: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-=[]\\;\',./~`!@#$%^&*()_+{}|:"<>?'
  };
  Counter.ScrollDirection = {
    Downwards: -1,
    Mixed: 0,
    Upwards: 1
  };

  function Counter(a, b) {
    this.wrapper = a; //document.getElementById(a);
    this.wrapperId = a.id;
    this.intervalTimerId = null;
    this.timeoutTimerId = null;
    this.isAnimating = false;
    this.animationStep = 0.0;
    this.animationProgress = 0.0;
    this.beforeAnimation = [];
    this.afterAnimation = [];
    this.digitsNumber = (b.digitsNumber || 6);
    this.direction = (b.direction || Counter.ScrollDirection.Mixed);
    this.value = (b.value || "");
    this.characterSet = (b.characterSet || Counter.DefaultCharacterSets.allCharacters);
    this.characterNumber = this.characterSet.length;
    this.animationDuration = (b.animationDuration || 50);
    var c = ["wrapper", "left", "inner", "right", "marker"];
    this.extraClassName = {};
    for (var i = 0; i < c.length; i++) {
      if (!b.extraClassName) {
        this.extraClassName[c[i]] = "";
      } else if (typeof b.extraClassName === "string") {
        this.extraClassName[c[i]] = b.extraClassName;
      } else {
        this.extraClassName[c[i]] = (b.extraClassName[c[i]] || "");
      }
    }
    this.onLoad = (b.onLoad || null);
    this.onValueChanged = (b.onValueChanged || null);
    var d = this;
    this.imageLoadCounter = 0;
    this.charsImage = new Image();
    this.charsImage.onload = function() {
      d.finishLoading();
    };
    this.charsImage.src = b.charsImageUrl;
    this.markerImage = new Image();
    this.markerImage.onload = function() {
      d.finishLoading();
    };
    this.markerImage.src = b.markerImageUrl;
  }
  Counter.prototype.finishLoading = function() {
    this.imageLoadCounter++;
    if (this.imageLoadCounter !== 2 || !this.charsImage.width || !this.markerImage.width) {
      return;
    }
    this.digitWidth = this.charsImage.width;
    this.digitHeight = Math.ceil(this.charsImage.height / this.characterNumber);
    this.offsetHeight = (this.markerImage.height - this.digitHeight) / 2;
    this.makrer = document.createElement("DIV");
    this.makrer.className = "counter_marker" + (this.extraClassName.marker ?
      " " : "") + this.extraClassName.marker;
    this.makrer.style.backgroundImage = "url('" + this.markerImage.src + "')";
    this.makrer.style.width = (this.digitWidth * this.digitsNumber + this.digitsNumber) + "px";
    this.makrer.style.height = this.markerImage.height + "px";
    this.wrapper.className = this.wrapper.className + (this.extraClassName.marker ?
      " " : "") + this.extraClassName.marker;
    this.wrapper.style.width = this.makrer.style.width;
    this.wrapper.style.height = this.makrer.style.height;
    this.wrapper.appendChild(this.makrer);
    var i = 0;
    var total_width = 0;
    for (i = 0; i < this.digitsNumber; i++) {
      var a = document.createElement("DIV");
      a.id = this.wrapperId + "_" + i;
      a.className = "counter_character";
      if (i === 0) {
        a.className += " counter_character_left" +
          (this.extraClassName.left ? " " : "") + this.extraClassName.left;
      } else if (i === this.digitsNumber - 1) {
        a.className += " counter_character_right" +
          (this.extraClassName.right ? " " : "") + this.extraClassName.right;
      } else {
        a.className += " counter_character_inner" +
          (this.extraClassName.inner ? " " : "") + this.extraClassName.inner;
      }
      a.style.backgroundImage = "url('" + this.charsImage.src + "')";
      a.style.width = this.digitWidth + "px";
      a.style.height = this.markerImage.height + "px";
      a.style.top = (-this.markerImage.height) + "px";
      this.wrapper.appendChild(a);
      total_width += Counter._parseInt(Counter._elementCurrentStyle(a, "margin-left"));
      total_width += Counter._parseInt(Counter._elementCurrentStyle(a, "margin-right"));
      total_width += Counter._parseInt(Counter._elementCurrentStyle(a, "border-left-width"));
      total_width += Counter._parseInt(Counter._elementCurrentStyle(a, "border-right-width"));
      total_width += this.digitWidth;
    }
    this.makrer.style.width = total_width + "px";
    this.wrapper.style.width = total_width + "px";
    if (this.onLoad !== null) {
      this.onLoad();
    }
    this.setValue(this.value, 100);
  };
  Counter.prototype.animate = function(a) {
    if (a) {
      this.animationProgress = 1.0;
    } else {
      this.animationProgress += this.animationStep;
    }
    if (this.animationProgress >= 1) {
      this.animationProgress = 1.0;
      if (this.timeoutTimerId) {
        clearTimeout(this.timeoutTimerId);
      }
      if (this.intervalTimerId) {
        clearTimeout(this.intervalTimerId);
      }
      this.isAnimating = false;
      this.timeoutTimerId = null;
      this.intervalTimerId = null;
    }
    var i = 0;
    var b = this.wrapper.id + "_";
    for (i = 0; i < this.beforeAnimation.length; i++) {
      //var c = document.getElementById(b + (this.digitsNumber - i - 1));
      var c = Counter._getDijitById(this, b + (this.digitsNumber - i - 1));
      if (c) {
        var d = 0.0;
        if (this.animationProgress < 1) {
          d = this.beforeAnimation[i] +
            (this.afterAnimation[i] - this.beforeAnimation[i]) * this.animationProgress;
        } else {
          d = this.afterAnimation[i];
        }
        //var e = this;
        c.style.backgroundPosition = "0px " + Counter._parseInt(d) + "px";
      }
    }
  };
  Counter.prototype.setValue = function(a, b) {
    if (this.imageLoadCounter !== 2 || !this.charsImage.width || !this.markerImage.width) {
      this.value = a;
      if (this.onValueChanged !== null) {
        this.onValueChanged();
      }
      return;
    }
    if (this.timeoutTimerId) {
      clearTimeout(this.timeoutTimerId);
    }
    if (this.intervalTimerId) {
      clearTimeout(this.intervalTimerId);
    }
    var i = 0;
    var c = this.wrapper.id + "_";
    //var d = [];
    var e;
    this.beforeAnimation = [];
    this.afterAnimation = [];
    for (i = this.digitsNumber - 1; i >= 0; i--) {
      //e = document.getElementById(c + (this.digitsNumber - i - 1));
      e = Counter._getDijitById(this, c + (this.digitsNumber - i - 1));
      this.beforeAnimation[i] = Number(e.style.backgroundPosition.substr(4).replace("px", ""));
    }
    var f = (this.value.toString ? this.value.toString() : String(this.value));
    var g = (a.toString ? a.toString() : String(a));
    for (i = this.digitsNumber - 1; i >= 0; i--) {
      //e = document.getElementById(c + (this.digitsNumber - i - 1));
      e = Counter._getDijitById(this, c + (this.digitsNumber - i - 1));
      var h = -1;
      if (f.length - i - 1 >= 0) {
        var j = f.charAt(f.length - i - 1).toUpperCase();
        h = this.characterSet.indexOf(j);
      }
      if (h === -1) {
        h = this.characterSet.indexOf(" ");
      }
      if (h === -1) {
        h = this.characterSet.indexOf("0");
      }
      if (h === -1) {
        h = 0;
      }
      var k = -1;
      if (g.length - i - 1 >= 0) {
        var l = g.charAt(g.length - i - 1).toUpperCase();
        k = this.characterSet.indexOf(l);
      }
      if (k === -1) {
        k = this.characterSet.indexOf(" ");
      }
      if (k === -1) {
        k = this.characterSet.indexOf("0");
      }
      if (k === -1) {
        k = 0;
      }
      //var m = this;
      this.afterAnimation[i] = Math.round((-this.digitHeight * k + this.offsetHeight));
      if (this.direction === 0) {
        if (Math.abs(h - k) > this.characterNumber / 2) {
          if (k < h) {
            this.beforeAnimation[i] = this.beforeAnimation[i] +
              this.digitHeight * this.characterNumber;
          } else {
            this.beforeAnimation[i] = this.beforeAnimation[i] -
              this.digitHeight * this.characterNumber;
          }
        }
      } else if (this.direction === -1) {
        if (this.beforeAnimation[i] > this.afterAnimation[i]) {
          this.beforeAnimation[i] = this.beforeAnimation[i] -
            this.digitHeight * this.characterNumber;
        }
      } else if (this.direction === 1) {
        if (this.beforeAnimation[i] < this.afterAnimation[i]) {
          this.beforeAnimation[i] = this.beforeAnimation[i] +
            this.digitHeight * this.characterNumber;
        }
      }
    }
    this.value = a;
    if (this.onValueChanged !== null) {
      this.onValueChanged();
    }
    if (!(b && parseInt(b, 10) > 0)) {
      b = 1000;
    }
    this.isAnimating = true;
    var n = this.animationDuration;
    this.animationStep = (n / b);
    this.animationProgress = 0.0;
    var o = this;
    if (b > n) {
      this.intervalTimerId = setInterval(function() {
        o.animate(false);
      }, n);
    }
    this.timeoutTimerId = setTimeout(function() {
      o.animate(true);
    }, b);
  };
  Counter._parseInt = function(a) {
    var b = parseInt(a, 10);
    if (isNaN(b)) {
      b = 0;
    }
    return b;
  };
  Counter._elementCurrentStyle = function(a, b) {
    if (a.currentStyle) {
      var i = 0,
        temp = "",
        changeCase = false;
      for (i = 0; i < b.length; i++) {
        if (b.charAt(i) && (b.charAt(i) !== '-' || b.charAt(i).toString() !== '-')) {
          if (b.charAt(i).toString) {
            temp = temp + (changeCase ? b.charAt(i).toString().toUpperCase() :
              b.charAt(i).toString());
          } else {
            temp = temp + (changeCase ? b.charAt(i).toUpperCase() : b.charAt(i));
          }
          changeCase = false;
        } else {
          changeCase = true;
        }
      }
      b = temp;
      return a.currentStyle[b];
    } else {
      return getComputedStyle(a, null).getPropertyValue(b);
    }
  };
  Counter._getDijitById = function(a, b) {
    var childNodes = a.wrapper.childNodes;
    for (var i = 0; i < childNodes.length; i++) {
      var node = childNodes[i];
      if (node.id === b) {
        return node;
      }
    }
    return null;
  };
  return Counter;
});
