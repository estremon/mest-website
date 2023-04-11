

1

/**

2

 * jQuery printPage Plugin

3

 * @version: 1.0

4

 * @author: Cedric Dugas, http://www.position-absolute.com

5

 * @licence: MIT

6

 * @desciption: jQuery page print plugin help you print your page in a better way

7

 */

8

​

9

(function( $ ){

10

  $.fn.printPage = function(options) {

11

    // EXTEND options for this button

12

    var pluginOptions = {

13

      attr : "href",

14

      url : false,

15

      message: "Please wait while we create your document"

16

    };

17

    $.extend(pluginOptions, options);

18

​

19

    this.on("click", function(){  loadPrintDocument(this, pluginOptions); return false;  });

20



21

    /**

22

     * Load & show message box, call iframe

23

     * @param {jQuery} el - The button calling the plugin

24

     * @param {Object} pluginOptions - options for this print button

25

     */

26

    function loadPrintDocument(el, pluginOptions){

27

      $("body").append(components.messageBox(pluginOptions.message));

28

      $("#printMessageBox").css("opacity", 0);

29

      $("#printMessageBox").animate({opacity:1}, 300, function() { addIframeToPage(el, pluginOptions); });

30

    }

31

    /**

32

     * Inject iframe into document and attempt to hide, it, can't use display:none

33

     * You can't print if the element is not dsplayed

34

     * @param {jQuery} el - The button calling the plugin

