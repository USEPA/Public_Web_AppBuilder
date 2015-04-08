define([
        "dojo/_base/declare",
        "dojo/dom-class" ,
        "dojo/dom-attr" ,
        "dojo/dom-construct",
        "dojo/query",
        "../../BaseDiscoveryMixin",
        "dijit/ProgressBar"
    ],
    function (declare, domClass, domAttr, domConstruct, query, BaseDiscoveryMixin, ProgressBar) {
        return declare([ BaseDiscoveryMixin], {
            /**
             * adds message from checkout handler
             * @param messageContainer
             * @param message
             * @param clear
             */
            addCheckoutElement: function (messageContainer, message, clear) {
                if (clear) {
                    domConstruct.empty(messageContainer);
                }
                var messageListItem;
                if (messageContainer && message) {
                    messageListItem = domConstruct.create("li", {className: "checkoutMessageEntry"});
                    if (typeof message === "string") {
                        domAttr.set(messageListItem, "innerHTML", message);
                    }
                    else {
                        domConstruct.place(message, messageListItem);
                    }
                    domConstruct.place(messageListItem, messageContainer);
                }
            },
            /**
             * creates a container for checkout handler messages
             */
            createCheckoutMessageContainer: function () {
                var container, messageList;
                container = domConstruct.create("div", {className: "checkoutMessageContainer"});
                messageList = domConstruct.create("ul", {className: "checkoutMessageList"});
                domConstruct.place(messageList, container);
                domConstruct.place(container, this.cartItemsCheckoutMessageContainer);
                return messageList;
            },
            /**
             * creates the checkout progress bar
             * @private
             */
            _createProgressBar: function () {
                this.progressBar = new ProgressBar({
                    indeterminate: true
                }, this.progressBarContainer);
                this.progressBarDomNode = this.progressBar.domNode;
            },
            hideRemoveFromCartIcons: function () {
                var i, removeFromCartElements = query("." + this.baseResultEntryName + "RemoveIcon", this.orderItemsContainer);
                for (i = 0; i < removeFromCartElements.length; i++) {
                    this._hideNode(removeFromCartElements[i]);
                }
            },
            showRemoveFromCartIcons: function () {
                var i, removeFromCartElements = query("." + this.baseResultEntryName + "RemoveIcon", this.orderItemsContainer);
                for (i = 0; i < removeFromCartElements.length; i++) {
                    this._showNode(removeFromCartElements[i]);
                }
            },
            hideMessageContainer: function () {
                this._hideNode(this.cartItemsCheckoutMessageContainer);
            },
            showMessageContainer: function () {
                this._showNode(this.cartItemsCheckoutMessageContainer);
            },
            showCheckoutCompleteButton: function () {
//                this._showNode(this.checkoutStatusCloseButton);
            },
            _hideNode: function (node) {
                if (!domClass.contains(node, "hidden")) {
                    domClass.add(node, "hidden");
                }
            },
            _showNode: function (node) {
                if (domClass.contains(node, "hidden")) {
                    domClass.remove(node, "hidden");
                }
            },
            showWebmapTab: function () {
                if (domClass.contains(this.webmapTab, "enabled")) {
                    return;
                }
//                this.hideReportingTab();
                this.hideDownloadTab();
                this._showNode(this.webmapTabContent);
                this.webmapWidget.showInputsContent();

                domClass.add(this.webmapTab, "enabled");
            },
            hideWebmapTab: function () {
                this._hideNode(this.webmapTabContent);
                domClass.remove(this.webmapTab, "enabled");
            },
            showDownloadTab: function () {
                if (domClass.contains(this.downloadTab, "enabled")) {
                    return;
                }
//                this.hideReportingTab();
                this.hideWebmapTab();
                this._showNode(this.downloadTabContent);
                domClass.add(this.downloadTab, "enabled");
            },
            hideDownloadTab: function () {
                this._hideNode(this.downloadTabContent);
                domClass.remove(this.downloadTab, "enabled");
            },
            disableDownload: function () {
                this._hideNode(this.downloadTabContent);
                this._hideNode(this.downloadTab);
                this.showWebmapTab();
            },
            enableDownload: function () {
                this._showNode(this.downloadTab);
                this.showDownloadTab();
            },
            showReportingTab: function () {
                /*
                 if (domClass.contains(this.reportingTab, "enabled")) {
                 return;
                 }
                 this.hideDownloadTab();
                 this.hideWebmapTab();
                 this._showNode(this.reportingTabContent);
                 domClass.add(this.reportingTab, "enabled");
                 */
            },
            hideReportingTab: function () {
//                this._hideNode(this.reportingTabContent);
//                domClass.remove(this.reportingTab, "enabled");
            }

        });
    });