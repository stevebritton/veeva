var pageResources = function ($) {

	var defaultSettings = {
			isDeployed: false
		},
		pageSettings;

	var sectionScroll = document.getElementById('section-scroller'),
		$resources = $('.resources-container div');


	var equalheight = function (container) {

		var currentTallest = 0,
			currentRowStart = 0,
			currentDiv = 0,
			rowDivs = [],
			$el,
			topPosition = 0;
		$(container).each(function () {

			$el = $(this);
			$($el).height('auto');
			topPosition = $el.position().top;

			if (currentRowStart !== topPosition) {
				for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
					rowDivs[currentDiv].height(currentTallest);
				}
				rowDivs.length = 0; // empty the array
				currentRowStart = topPosition;
				currentTallest = $el.height();
				rowDivs.push($el);
			} else {
				rowDivs.push($el);
				currentTallest = (currentTallest < $el.height()) ? ($el.height()) : (currentTallest);
			}
			for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
				rowDivs[currentDiv].height(currentTallest);
			}
		});
	};



	var loadResources = function (cb) {

		$.getJSON('resources.json').done(function (json) {

			$.each(json, function (i, o) {

				var section = o.section,
					title = o.title,
					url = o.source,
					thumb = section + '-thumb.jpg',
					strItem = '';


				strItem = $('<article><a href="#" data-section="' + url + '" class="btnGoto"><img src="thumbs/' + thumb + '"><div class="head">' + title + '</div></article>');

				$(strItem).appendTo($resources);

			});

			//Callback
			cb();



		}).fail(function (jqxhr, textStatus, error) {
			//var err = textStatus + ', ' + error;
		});

	};

	var setupPage = function () {

		//Make sure there's a scroller

		if (sectionScroll) {
			sectionScroll = new IScroll('#section-scroller', {
				scrollX: true,
				freeScroll: true,
				mouseWheel: true,
				scrollbars: true,
				tap: true
			});
		}


		//Pull all items to the left
		$('#section-scroller article').addClass('pull-left');

		//Set equal heights
		equalheight('.resources-container article');


		$resources.on('tap', '.btnGoto', function (e) {

			e.preventDefault();

			var _this = $(this),
				_section = _this.attr('data-section') !== undefined ? _this.attr('data-section') : '';



			if (pageSettings.isDeployed) {
				veevaGoToSlide(_section, pageSettings.presentationPDFs);

			} else {
				document.location = _section;
			}

		});

	};

	return {
		//main function to initiate the module
		init: function (options) {

			//set options
			pageSettings = $.extend(defaultSettings, options);

			loadResources(function () {

				setupPage();
			});

		}
	};

}(jQuery);
