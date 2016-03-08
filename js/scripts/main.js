
/*global $, window, document, jQuery, utilKeyMessages, IScroll, com */

/**
 * VEEVA Module JS Library
 *
 * @version 0.0.2
 *
 *
 * @author Steven Britton    <stvnbritton@gmail.com>

 * @uses utilKeyMessages
 * @uses jQuery 1.7.2
 * @uses IScroll
 * @uses com Veeva Library for CLM v2.0
 */


var VEEVA = VEEVA || {};

;(function( window, document, $, undefined ) {



    VEEVA.iRep = function iRep(settings) {

        var name                        = 'VEEVA Module JS Library';

        this.veevaTrackSubsceneField    = settings.veevaTrackSubsceneField;
        this.product                    = settings.product;
        this.presentationPrimary        = settings.presentationPrimary;
        this.presentationPDFs           = settings.presentationPDFs;
        this.presentationVideos         = settings.presentationVideos;

        this.currentSectionName         = settings.section;
        this.currentSection             = '';

        this.currentKeyMessage          = '';

        this.rootURL                    = '';
        this.isDeployed                 = settings.isDeployed === true ? true : false;
        this.debug                      = settings.isDeployed ? false : true;
        this.appConfigFile              = 'global/app.json';

        this.eventClick                 = settings.isDeployed ? 'touchend' : 'click';

        this.appBody                    = $('#app-body');
        this.containerMainISI           = '#main-isi';
        this.btnISI                     = $('.isi-bar');
        this.fileISI                    = 'global/isi.html';

        this.startTimeout               = '';
        this.mainISI                    = '';
        this.popup                      = '';

        this.sectionNumber              = 0;
        this.slideNumber                = 0;
        this.state                      = {};
        this.bottomAdded                = false;

        this._init();
    };

    VEEVA.iRep.prototype = {

        constructor: VEEVA.iRep,

        /* Debug logging (if enabled). */
        log: function () {

            if (this.debug) {
                window.top.console.log('', arguments);
            }
            return this;
        },

        _init: function () {

            var $this = this;

            $this.log('Product: ', $this.product);
            $this.log('Loading: ', $this.appConfigFile);

            $.ajax({
                type: 'GET',
                url: $this.appConfigFile,
                dataType: 'json',
                success: function (data) {
                    utilKeyMessages.loadKeymessages(data);

                    $this.log('Loading app.json', utilKeyMessages);

                    $this.start();
                },
                error: function () {
                    $this.log('Error: issue loading file ', $this.appConfigFile);
                }

            });

        },


        start: function () {

            var $this = this;

            $this.log('Init: App');
            $this.log('This Object: ', $this);

            var hash = location.hash.substr(1);

            if(hash === 'screenshot'){
                $this.isDeployed = false;
            }

            $this.btnISI.one($this.eventClick, function (e) {

                $this.log('Event: ISI button ', $this.eventClick);

                e.preventDefault();
                e.stopPropagation();


                if ($($this.containerMainISI).length === 0) {

                    /* Append new section to the DOM */
                    $this.appBody.append('<section id="main-isi" class="main-isi" />');

                    $this.mainISI = new MainISI($this);
                }
            });


            /**
             * Tap event listener for product logo.
             * @author Steven Britton
             * @date   2015-03-26
             * @todo Remove hard-coded product name with property passed down from global settings.
             */
            $this.appBody.find('.logo-product').on($this.eventClick, function () {

                $this.log('Event: Product logo ', $this.eventClick);
                if ($this.isDeployed) {
                    veevaGoToSlide($this.product + '-home.zip', $this.presentationPrimary);
                } else {
                    document.location = '../' + $this.product + '-home/' +$this.product + '-home.html';
                }
            });


            $this.appBody.on($this.eventClick, '.btn-goto', function (event) {

                event.preventDefault();

                $this.log($this, 'Event: btn-goto', event);

                var _this = $(this),
                    _section = _this.attr('data-section') !== undefined ? _this.attr('data-section') : '',
                    _slide = _this.attr('data-slide') !== undefined ? _this.attr('data-slide') : '0';


                //Only run if deployed, and if it is, then run Veeva scripts
                if ($this.isDeployed) {

                    //Update subscence field and then go to slide
                    veevaUpdateUserObject(_slide, function () {
                        veevaGoToSlide(_section + '.zip', $this.presentationPrimary);
                    });
                }

            });

            /**
             * Event Listner for linking to other Presentations
             * @author Steven Britton
             * @date   2015-04-20
             */
            $this.appBody.on($this.eventClick, '.btn-external', function (event) {

                event.preventDefault();

                $this.log($this, 'Event: btn-external', event);

                var _this = $(this),
                    _keyMessage = _this.attr('data-key-message') !== undefined ? _this.attr('data-key-message') : '',
                    _presentation = _this.attr('data-veeva-presentation') || $this.presentationPrimary;

                //Only run if deployed, and if it is, then run Veeva scripts
                if ($this.isDeployed && _keyMessage !=='' && _presentation !== '') {

                    //Update subscence field and then go to slide
                    veevaUpdateUserObject(_keyMessage, function () {
                        veevaGoToSlide(_keyMessage + '.zip', _presentation);
                    });
                }

            });


            $(window).on('hashchange', function (e) {
                $this.pageChanged(e);
            });

            /*
            window.addEventListener('hashchange', function(e){
                $this.pageChanged(e);
            }, false);
            */

            document.addEventListener('touchmove', function (e) {
                e.preventDefault();
            });

            $this.appBody.on('show.popup.MD', function (event) {

                $this.log('Event: ', 'triggered', 'show.popup.MD', event);

                $this.closePopup();

                if(event.url){
                    $this.openPopup(event);
                }

                //Check for tracking codes
                if (event.trackID && $this.isDeployed) {

                    //Add Veeva Click stream tracking
                    addCallClickstream(event);
                }

            });

            //Check to see if SubScene should be loaded using Veeva custom field
            if ($this.isDeployed) {
                veevaCheckForSubScene(function (blnSceneChanged) {
                    if (!blnSceneChanged) {
                        //Trigger function
                        $(window).trigger('hashchange');
                    }
                });
            }
            else{
                $(window).trigger('hashchange');
            }


            return this;
        }

    };

    VEEVA.iRep.prototype.pageChanged = function (event) {

        var $this = this;

        $this.log('Event: hashchange firing', $this);


        // Get the State Object
        $this.state = event.getState();

        var hasState = false;
        for (var key in $this.state) {
            hasState = true;
        }

        //Set current section
        $this.state['section'] = $this.currentSectionName;

        $this.log('State: ', $this.state);


        if (!$this.state['pageChange']) {

            // Stop the start view timer if someone clicks on a link while it is open
            window.clearTimeout($this.startTimeout);

            $('#section-holder').detach();
            $('#content-main').detach();

            $this.closePopup();

            if ($this.state['section']) {

                $this.appBody.find('section.main-content section.page-load').append('<div id="section-holder" />');

                $this.currentKeyMessage = utilKeyMessages.getKeyMessageByName($this.currentSectionName);

                var nextSection =  utilKeyMessages.getKeyMessageByIndex($this.currentKeyMessage.index+1),
                    prevSection =  utilKeyMessages.getKeyMessageByIndex($this.currentKeyMessage.index-1);


                var sectionDetails = {
                    page: $this.state['page'] || 0,
                    section: $this.currentKeyMessage,
                    sectionKey: $this.currentSectionName,
                    sectionIndex: $this.currentKeyMessage.index,
                    numSlides: $this.currentKeyMessage.numSlides,
                    sectionNextIndex: $this.currentKeyMessage.sectionNextIndex,
                    nextSection: nextSection,
                    nextSectionKey: nextSection.key_message,
                    nextSectionURL: nextSection.key_message + '.html',
                    prevSection: prevSection,
                    prevSectionKey: prevSection.key_message,
                    prevSectionURL: prevSection.key_message + '.html',
                    prevSectionnNumSlides: prevSection.slides.length,
                };

                $this.currentSection = new Section($this, $('#section-holder'), sectionDetails, function () {

                    var appReadyEvent = $.Event('veeva.app.ready');

                    $this.log('Event: veeva.app.ready');

                    $('.main-content').fadeIn('slow');


                    $this.appBody.trigger(appReadyEvent);

                    //check for auto popups
                    if ($this.state['#popup']) {

                        var pLink = $this.state['#popup'];

                        pLink = pLink.slice(pLink.lastIndexOf('=') + 1, pLink.length);


                        // Trigger Popup event
                        var popEvent = $.Event('show.popup.MD');
                        popEvent.url = pLink;
                        popEvent.popupType = 'popup';

                        $this.appBody.trigger(popEvent);

                    }
                });

            }
        } else {

            $this.closePopup();

        }
        return $this;
    };

    VEEVA.iRep.prototype.closePopup = function () {

        /*
        if (this.popup) {
            $('#popup', this.appBody).detach();
            this.popup = null;
        }
        */
        return this;
    };

    VEEVA.iRep.prototype.openPopup = function (event) {

        var $that       = this,
            $element    = '',
            url         = event.url;


        /**
         * Only build popup once and then reuse it
         * @author Steven Britton
         * @date   2015-08-04
         */
        if($that.popup === ''){

            var buildPopup = '<div id="popup-wrapper"><div id="' + event.popupType + '" class="popup-inner">';
                buildPopup += '<a href="javascript:void(0)" class="close-button" ></a></div></div>';

            $(buildPopup).appendTo($that.appBody);

            $that.popup = $('#popup-wrapper');
        }

        $that.popup.addClass('on');

        $element = $that.popup.find('#popup');

        $element.load(url,
            function (response, status, xhr) {
                $element.append( $('<a href="javascript:void(0)" class="close-button" />'));
                if (status === 'error') {
                    var loadError = xhr.status + ' ' + xhr.statusText;

                    $element.append('<h1 class="error">' + loadError + '</h1>');
                }
                if (status === 'success') {
                    sectionLoaded();
                }
            }
        );


        var sectionLoaded = function () {

            if ($element.attr('id') === 'popup') {

                $element.clearQueue().show('scale', {
                    percent: 50,
                    direction: 'both'
                }, 100, function () {

                    $element.trigger('popup.Ready');

                    $element.veevaLink({
                        'eventClick':           $that.eventClick,
                        'primaryPresentation':  $that.presentationPrimary,
                        'videoPresentation':    $that.presentationVideos,
                        'pdfPresentation':      $that.presentationPDFs
                    });

                });

            } else {
                $element.show().animate({
                    opacity: 1
                }, function () {
                    $element.trigger('popup.Ready');
                });
            }

        };

        $that.popup.off().on($that.eventClick, '.close-button', function (e) {
            e.preventDefault();
            e.stopPropagation();

            $element.animate({
                top: 0,
                opacity: 0
            }, 400, function () {

                $(this).removeAttr('style');

                $element.find('.content').detach();

                $that.popup.removeClass('on');

            });
        });

        return  $that;
    };



    /**********************************************************
     ** SECTION
     ** Note: loads section based on app.json
     ***********************************************************/
    var Section = function (_that, _element, _options, callback) {

        var $that = _that,
            $this = this,
            defaults = {
                page: 0
            };

        var $element = _element,
            options = $.extend(defaults, _options);

        var $Section = $('<div class="slider section-' + options.sectionKey + '">').append('<ul class="slideObj">').appendTo($element);
        var $subnav = $('<div><ul class="nostyle">');
        var $Slides = $(options.section.slides);
        var numSlides = $Slides.length;


        //build sub nav
        $Slides.each(function (i, slide) {
            $('<li><a href="#" class="page-button trigger-swipe" id="' + slide.id + '" slideindex="' + i + '"><span class="nav-outer"><span>' + slide.slide + '</span></span></div></div></a></li>').appendTo($('ul', $subnav));
        });

        $this.name          = options.sectionKey;
        $this.activeSlide   = options.page !== 0 ? (options.page -1) : options.page;
        $this.noSwipeZones  = [];

        //build slides
        $Slides.each(function (i, obj) {
            var $slide              = $(obj),
                slideID             = obj.id;

            var list = $('<li class="slide slideObj" id="slide' + slideID + '"></li>').prepend($('<div class="content"></div>').prepend($('.page-load slide#' + slideID)));

            var noSwipeZone             = obj.noSwipeZone || false,
                noSwipeZoneYtop         = noSwipeZone.yTop !== '' ? parseInt(noSwipeZone.yTop) : 0,
                noSwipeZoneYbottom      = noSwipeZone.yBottom !== '' ? parseInt(noSwipeZone.yBottom) : 0;

            $this.Slide(list, $slide, {
                subnav: $subnav,
                slides: numSlides
            }, $that);

            /**
             * Add no swipe zones to the Section object
             */
            $this.noSwipeZones.push({'slide': i, 'yTop': noSwipeZoneYtop, 'yBottom':noSwipeZoneYbottom});

            $Section.find('ul.slideObj').append(list);

        });


        $Section.swipeSlider({
            debug: $that.debug,
            eventClick: $that.eventClick,
            speed: 500,
            startIndex: options.page,
            stateManager: false,
            blnSwiping: true,
            noSwipeZone: $this.noSwipeZones ? $this.noSwipeZones :  false,
            controlsShow: true,
            onSlideChange: function(element, index){

                var slideIndex                  = index,
                    slideEvent                  = $.Event('change.slider.MD');
                    slideEvent.slide            = index;

                element.trigger(slideEvent);

                $that.log('Event: change.slider.MD', element, index);

                $that.closePopup();

                //$('#section-holder').fadeIn();

                //Fadeout chart builds
                //@todo: handle this by swapping out classes
                $('.chart.reload').fadeOut();

                var $trackSlide = $('ul.slideObj li.slideObj:eq(' + slideIndex + ')'),
                    hasTracking = $trackSlide.attr('track-id') !== undefined ? $trackSlide.attr('track-id') : '';

                //If this is a sub-key-message then
                //Get Tracking info and call addCallClickstream function
                if (hasTracking.length > 0 && $that.isDeployed) {
                    event.trackID = hasTracking;
                    event.trackType = $trackSlide.attr('track-type');
                    event.trackDescription = $trackSlide.attr('track-description');

                    //Add Veeva Click stream tracking
                    addCallClickstream(event);
                }

            },
            onSlideAfterChange: function(slider, index){

                var slides          = slider.find('ul.slideObj li.slideObj'),
                    activeSlide     = slides[index];

                /** reload chart, if any */
                $(activeSlide).find('.chart.reload').fadeIn();

            },
            onSectionChange: function (dir) {

                var prevSectionLastSlide = $that.isDeployed ? options.prevSectionURL.replace('.html', '.zip') : '../' + options.prevSectionURL.slice(0, -5) + '/' + options.prevSectionURL + '#page=' + options.prevSectionnNumSlides,
                    nextSectionFirstSlide = $that.isDeployed ? options.nextSectionURL.replace('.html', '.zip') : '../' + options.nextSectionURL.slice(0, -5) + '/' + options.nextSectionURL,
                    setClass = dir === 'prev' ? 'slide-left' : 'slide-right',
                    setURL = dir === 'prev' ? prevSectionLastSlide : nextSectionFirstSlide;

                $('#section-holder').addClass(setClass);

                if ((options.prevSectionKey !== undefined && dir === 'prev') || (options.nextSectionKey !== undefined && dir === 'next')) {

                    if ($that.isDeployed) {

                        //Set custom field to load last slide of previous section
                        if (dir === 'prev' && options.prevSectionnNumSlides !== '0') {

                            veevaUpdateUserObject(options.prevSectionnNumSlides, function () {});

                        }

                        setTimeout(function () {
                            veevaGoToSlide(setURL, $that.presentationPrimary);
                        }, 200);
                    } else {

                        $('section.main-content').fadeOut(300, function () {
                            window.location = setURL;
                        });
                    }
                }

                return this;
            }

        });

        $('#section-holder').fadeIn();


        callback();
    };


    Section.prototype.Slide = function (_element, _slide, _options, _that) {

        var $that = _that;
        var $this = this;
        var defaults = {
            subnav: '',
            slides: ''
        };
        var options = $.extend(defaults, _options);

        var slide = _slide[0];
        var $element = $(_element[0]);


        //Add tracking to sub-key messages
        if (slide.track) {
            $element.attr('track-id', slide.id).attr('track-type', slide.track).attr('track-description', slide.slide);
        }

        $('<div class="subnav">').append(options.subnav.html()).appendTo($element);

        $('<div class="ctrl-next-slide"></div><div class="ctrl-pre-slide"></div>').appendTo($element);

        $element.find('a#' + slide.id).addClass('active');

        $($element, '#slide' + slide.id).find('.ctrl-next-slide').on($that.eventClick, function (e) {
            e.preventDefault();
            $('a', '#nextBtn').trigger($that.eventClick);
        });

        $($element, '#slide' + slide.id).find('.ctrl-pre-slide').on($that.eventClick, function (e) {
            e.preventDefault();
            $('a', '#prevBtn').trigger($that.eventClick);
        });

        // Plugins to override popups
        $element.popupLinks({'eventClick': $that.eventClick});


        $element.veevaLink({
            'eventClick': $that.eventClick,
            'primaryPresentation': $that.presentationPrimary,
            'videoPresentation': $that.presentationVideos,
            'pdfPresentation': $that.presentationPDFs
        });


        $element.on($that.eventClick, '.open-chart', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $this = $(this),
                popEvent = $.Event('show.popup.MD'),
                popupType = $this.attr('popup-type') === 'popupFull' ? 'popupFull' : 'popup',
                pLink = $this.attr('data-link');

            pLink = pLink.slice(pLink.lastIndexOf('=') + 1, pLink.length);

            popEvent.url = pLink;
            popEvent.popupType = popupType;

            //Get Tracking info
            popEvent.trackID = $this.attr('track-id');
            popEvent.trackType = $this.attr('track-type');
            popEvent.trackDescription = $this.attr('track-description');

            $this.trigger(popEvent);

            return false;
        });

        $element.bind('stateChange', function (event) {
            if ($('.' + event.targetClass, $this).length > 0) {
                $('.state:not(.hidden)', $this).addClass('hidden');
                $('.' + event.targetClass, $this).removeClass('hidden');
            }
        });

        return $this;

    }; //end of Slide



    var MainISI = function (_this) {

        var $that       = _this,
            $mainISI    = $($that.containerMainISI),
            isiOpen     = false,
            isiSlider   = null;

        $that.log('Function load: MainISI');

        $mainISI.append().load($that.fileISI,
            function (response, status, xhr) {
                if (status === 'error') {
                    var loadError = xhr.status + ' ' + xhr.statusText;
                    $(this).append('<h1 class="error">' + loadError + '</h1>');
                }
                if (status === 'success') {
                    sectionLoaded();
                }
            }
        );

        var sectionLoaded = function () {

            $that.btnISI.on($that.eventClick, function (e) {
                eventHandlerToggleISI(e);
                e.stopPropagation();
            });

            var eventHandlerToggleISI = function (e) {

                if (e.preventDefault) {
                    e.preventDefault();
                }

                if (isiSlider && isiOpen) {
                    isiOpen = false;
                    $that.btnISI.find('.btn-isi').removeClass('on').addClass('off').html('Open');
                    $mainISI.removeClass('open').addClass('close');
                    isiSlider.destroy();
                    isiSlider = null;
                } else if (e.type === $that.eventClick) {
                    isiOpen = true;


                    $that.btnISI.find('.btn-isi').removeClass('off').addClass('on').html('Close');

                    //Create IScroll object
                    isiSlider = new IScroll('#main-isi', {
                        mouseWheel: true,
                        momentum: true,
                        checkDOMChanges: true,
                        onDestroy: function () {
                            $mainISI.css({
                                'overflow-y': 'auto'
                            }).removeClass('open').addClass('close');
                        }

                    });
                    $mainISI.removeClass('close').addClass('open').css({
                        'overflow-y': 'auto'
                    });

                    /**
                     * Handles ebent click for embedded PDFs in ISI Drop Down
                     * @author Steven Britton
                     * @date   2015-03-26
                     * @todo update hard-coded product names with property passed throguh global settings.
                     */
                    $mainISI.find('.pi-link').on('touchstart', function () {
                        document.location = 'veeva:gotoSlide(Prescribing-Information.zip, ' + $that.presentationPDFs +')';
                    });
                }
            };

            $that.btnISI.trigger($that.eventClick);

        };

        return $that;
    };





})(window, document, jQuery, undefined);



//Handle going to sub-slides
function changeState(page) {

    var state = {};

    state['page'] = page;

    $.bbq.pushState(state);

}


function addCallClickstream(event) {
    var clickStream = {};

    clickStream.Track_Element_Id_vod__c = event.trackID;
    clickStream.Track_Element_Type_vod__c = event.trackType;
    clickStream.Track_Element_Description_vod__c = event.trackDescription;

    //Save the tracking data to Veeva Object
    com.veeva.clm.createRecord('Call_Clickstream_vod__c', clickStream, function(){

    });
}


/**
 * [veevaUpdateUserObject description]
 * @used sitemap
 * @used resources
 */
function veevaGoToSlide(slide, presentation) {

    document.location = 'veeva:gotoSlide(' + slide + ', ' + presentation + ')';
}

function veevaCheckForSubScene(cb) {


    com.veeva.clm.getDataForCurrentObject('User', 'Stored_GoToSlide_HZN__c', function(result) {
        if (result.success) {

            var subscene = result.User.Stored_GoToSlide_HZN__c;

            //Jump to the scene specified in subscene above
            if (subscene !== '0') {

                changeState(subscene);

                //Clear subscene field
                veevaUpdateUserObject('0', cb, true);

                return;
            } else {
                cb(false);
            }

        }
    });
}


/**
 * [veevaUpdateUserObject description]
 * @used sitemap
 */
function veevaUpdateUserObject(subscene, cb) {
    var dataString = {};

    dataString.Stored_GoToSlide_HZN__c = subscene;
    com.veeva.clm.getDataForCurrentObject('User', 'ID', function (result) {
        com.veeva.clm.updateRecord('User', result.User.ID, dataString, cb);
    });
}

