;(function($){


    $.fn.veevaLink = function(options) {

        var defaults = {
            eventClick: 'click',
            primaryPresentation: '',
            videoPresentation: '',
            pdfPresentation:'',
        };

        var breakUp = function (str) {
            var querystring = str.replace( '#', '' ).split( '&' ),
                queryObj = {};

                for (var i = 0, len = querystring.length; i < len; i++) {
                    var name  = querystring[i].split('=')[0],
                        value = querystring[i].split('=')[1];
                    queryObj[name] = value;
                }
                return queryObj;
            };

        var settings = $.extend(defaults, options);

        if (!this){
            return false;
        }

        return this.each(function() {

            $('a[href*="veevaLink"]', $(this)).on(settings.eventClick, function(event){

                event.preventDefault();

                var $this               = $(this),
                    linkObj             = breakUp($this.attr('href')),
                    pLink               = linkObj.veevaLink,
                    pType               = linkObj.type,
                    veevaPresentation   = pType === 'pdf' ? settings.pdfPresentation : settings.videoPresentation;

                    document.location = 'veeva:gotoSlide('+pLink+'.zip,'+veevaPresentation+')';
                return false;
            });
        });
    };

    $.fn.stateLinks = function(options) {
        // Default thresholds & swipe functions
        var defaults = {
        };

        var options = $.extend(defaults, options);

        if (!this) return false;

        return this.each(function() {
            $('a[href*="#state"]', $(this)).click(function(){

                var pLink = $(this).attr('href');
                pLink = pLink.slice(pLink.lastIndexOf('=')+1, pLink.length);

                // Trigger Popup event
                var stateEvent = $.Event('stateChange');
                stateEvent.targetClass = pLink;
                $(this).trigger(stateEvent);
                //
                //console.log("state change");
                // Toggles active class for button
                $(this).siblings().removeClass('active');
                $(this).addClass('active');
                //
                return false;
            });
        });
    };


    $.fn.popupLinks = function(options) {

        // Default thresholds & swipe functions
        var defaults = {
            eventClick: 'click'
        };

        var settings = $.extend(defaults, options);

        if (!this){
            return false;
        }

        return this.each(function() {

            $('a[href*="#popup"]', $(this)).on(settings.eventClick, function(e){



                e.preventDefault();

                var $this       = $(this),
                    popEvent    = $.Event('show.popup.MD'),
                    popupType   = $this.attr('popup-type') === 'popupFull' ? 'popupFull' : 'popup',
                    pLink       = $this.attr('href');

                    pLink       = pLink.slice(pLink.lastIndexOf('=')+1, pLink.length);

                    popEvent.url                = pLink;
                    popEvent.popupType          = popupType;

                    //Get Tracking info
                    popEvent.trackID            = $this.attr('track-id');
                    popEvent.trackType          = $this.attr('track-type');
                    popEvent.trackDescription   = $this.attr('track-description');



                    $this.trigger(popEvent);


            });
        });
    };




    $.fn.directLinks = function(options) {

        // Default thresholds & swipe functions
        var defaults = {
        };

        var options = $.extend(defaults, options);

        if (!this) return false;

        return this.each(function() {
            $('a[href*="#direct"]', $(this)).click(function(){

                var pLink = $(this).attr('href');
                pLink = pLink.slice(pLink.lastIndexOf('=')+1, pLink.length);

                // Trigger Popup event
                //var popEvent = $.Event('show.popup.MD');
                //popEvent.url = pLink;
                //$(this).trigger(popEvent);
                //

                //console.log("show pdf:", pLink);

                window.location = pLink;

                return false;
            });
        });
    };



    $.fn.swipe = function(options) {

        // Default thresholds & swipe functions
        var defaults = {
            threshold: {
                x: 100,
                y: 100
            },
            swipeLeft: function() { console.log('swiped left') },
            swipeRight: function() { console.log('swiped right') },
            swipeUp: function() { console.log('swiped up') },
            swipeDown: function() { console.log('swiped down') }
        };

        var options = $.extend(defaults, options);

        if (!this) return false;

        return this.each(function() {

            var me = $(this)

            // Private variables for each element
            var originalCoord = { x: 0, y: 0 }
            var finalCoord = { x: 0, y: 0 }

            // Screen touched, store the original coordinate
            function touchStart(event) {
                //console.log('Starting swipe gesture...')
                originalCoord.x = event.targetTouches[0].pageX
                originalCoord.y = event.targetTouches[0].pageY
            }

            // Store coordinates as finger is swiping
            function touchMove(event) {
              event.preventDefault();
                finalCoord.x = event.targetTouches[0].pageX // Updated X,Y coordinates
                finalCoord.y = event.targetTouches[0].pageY
            }

            // Done Swiping
            // Swipe should only be on X axis, ignore if swipe on Y axis
            // Calculate if the swipe was left or right
            function touchEnd(event) {
                //console.log('Ending swipe gesture...')
                var changeY = originalCoord.y - finalCoord.y;
                var changeX = originalCoord.x - finalCoord.x;
                if(changeY < defaults.threshold.y && changeY > (defaults.threshold.y*-1)) {
                    if(changeX > defaults.threshold.x) {
                        defaults.swipeLeft()
                    }
                    if(changeX < (defaults.threshold.x*-1)) {
                        defaults.swipeRight()
                    }
                } else if (changeX < defaults.threshold.x && changeX > (defaults.threshold.x*-1)) {
                    if(changeY > defaults.threshold.y) {
                        defaults.swipeUp()
                    }
                    if(changeY < (defaults.threshold.y*-1)) {
                        defaults.swipeDown()
                    }
                }
            }

            // Swipe was started
            function touchStart(event) {
                //console.log('Starting swipe gesture...')
                originalCoord.x = event.targetTouches[0].pageX
                originalCoord.y = event.targetTouches[0].pageY

                finalCoord.x = originalCoord.x
                finalCoord.y = originalCoord.y
            }

            // Swipe was canceled
            function touchCancel(event) {
                //console.log('Canceling swipe gesture...')
            }

            // Add gestures to all swipable areas
            this.addEventListener("touchstart", touchStart, false);
            this.addEventListener("touchmove", touchMove, false);
            this.addEventListener("touchend", touchEnd, false);
            this.addEventListener("touchcancel", touchCancel, false);

        });
    };

})(jQuery);
