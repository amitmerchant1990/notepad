$(document).ready(function () {
    // Affiliate links data
	const affiliateLinks = [
		{
			text: "Video Tap — Effortlessly turn your videos into text-based content",
			url: "https://videotap.com?via=amitmerchant",
			active: false
		},
		{
			text: "Support Notepad's sustainable development — Buy me a coffee! ❤️",
			url: "https://buymeacoffee.com/amitmerchant",
			active: false
		},
        {
			text: "I work on this app in my spare time. Buy me a coffee for your support!",
			url: "https://buymeacoffee.com/amitmerchant",
			active: true
		},
		{
			text: "Buy me a coffee if you enjoy using this little app! 😻",
			url: "https://buymeacoffee.com/amitmerchant",
			active: true
		},
		{
			text: "🚀 New → Simple Kanban",
			url: "/kanban",
			active: false
		},
		{
			isFeature: true,
			isActive: true,
			text: "Want to try a Deep Breathing Exercise tool? 🧘",
			url: "#new-feature-modal",
			dataTarget: "#newFeatureModal",
			active: false
		}
	];

	// Function to show random affiliate link
	function showRandomAffiliateLink() {
		const activeAffiliates = affiliateLinks.filter(affiliate => affiliate.active);
		const randomIndex = Math.floor(Math.random() * activeAffiliates.length);
		const affiliate = activeAffiliates[randomIndex];

		if (!affiliate) {
			return;
		}

		$('#affiliateText').text(affiliate.text);
		$('#affiliateLink').attr('href', affiliate.url);
		$('#affiliatePopup').addClass('show');

		if (affiliate.isFeature && affiliate.isActive) {
			$('#affiliateLink').attr('data-target', affiliate.dataTarget);
			$('#affiliateLink').attr('data-toggle', 'modal');
			$('#affiliateLink').removeAttr('target');
		}
	}

	// Close affiliate popup
	$('#closeAffiliatePopup').on('click', function () {
		$('#affiliatePopup').removeClass('show');
	});

	// Show affiliate popup after a delay
	setTimeout(showRandomAffiliateLink, 5000);

    const quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Type your text here...',
        modules: {
            toolbar: [
              // Text formatting options
              ['bold', 'italic', 'underline', 'strike'],
              ['blockquote', 'code-block'],
              
              // List formatting
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'indent': '-1'}, { 'indent': '+1' }],
              
              // Text alignment
              [{ 'align': [] }],
              
              // Links and embeds
              ['link', 'image', 'video'],
              
              // Font and size
              [{ 'font': [] }, { 'size': ['small', 'medium', 'large', 'huge'] }],
              
              // Color options
              [{ 'color': [] }, { 'background': [] }],
              
              // More advanced formatting
              [{ 'script': 'sub'}, { 'script': 'super'}],
              
              // Emoji and symbols (optional)
              ['formula']
            ]
          }
    });

    quill.focus();

    quill.on('text-change', (delta, oldDelta, source) => {
        var html = quill.root.innerHTML; // Get HTML content
        localStorage.setItem('richNotes', html); // Save HTML to localStorage
    });

    // Load saved HTML from localStorage when the editor initializes
    window.addEventListener('load', function () {
        var savedHtml = localStorage.getItem('richNotes');
        if (savedHtml) {
            quill.root.innerHTML = savedHtml;
        }
    });

    $('#download').click(function () {
        $('#iconDropdown').toggleClass('show');
    })

    $('#downloadNotesPdf').click(function () {
        downloadAsPdf();
    });

    $('#downloadNotesHtml').click(function () {
        saveHTML();
    })

    $(document).on('click', function (event) {
        if(
            $('#iconDropdown').hasClass('show') 
            && !$(event.target).is('#themeIcon')
        ) {
		    $('#iconDropdown').removeClass('show');
        }
	});

    // This listens for keyboard shortcuts
	document.onkeydown = function (event) {
		event = event || window.event;

		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
			downloadAsPdf();
			event.preventDefault();
		}
    };

    function getPdfReadyHtml() {
        const root = quill.root.cloneNode(true);

        // Base editor styles
        root.style.fontFamily = 'Helvetica, Arial, sans-serif';
        root.style.fontSize = '13px';
        root.style.lineHeight = '1.42';
        root.style.whiteSpace = 'pre-wrap';
        root.style.wordWrap = 'break-word';

        /* --------------------
        * ALIGNMENT
        * -------------------- */
        root.querySelectorAll('.ql-align-center').forEach(el => {
            el.style.textAlign = 'center';
        });

        root.querySelectorAll('.ql-align-right').forEach(el => {
            el.style.textAlign = 'right';
        });

        root.querySelectorAll('.ql-align-justify').forEach(el => {
            el.style.textAlign = 'justify';
        });

        /* --------------------
        * HEADINGS
        * -------------------- */
        root.querySelectorAll('h1').forEach(el => el.style.fontSize = '2em');
        root.querySelectorAll('h2').forEach(el => el.style.fontSize = '1.5em');
        root.querySelectorAll('h3').forEach(el => el.style.fontSize = '1.17em');
        root.querySelectorAll('h4').forEach(el => el.style.fontSize = '1em');
        root.querySelectorAll('h5').forEach(el => el.style.fontSize = '0.83em');
        root.querySelectorAll('h6').forEach(el => el.style.fontSize = '0.67em');

        /* --------------------
        * FONT FAMILIES
        * -------------------- */
        root.querySelectorAll('.ql-font-serif').forEach(el => {
            el.style.fontFamily = 'Georgia, "Times New Roman", serif';
        });

        root.querySelectorAll('.ql-font-monospace').forEach(el => {
            el.style.fontFamily = 'Monaco, "Courier New", monospace';
        });

        /* --------------------
        * FONT SIZES
        * -------------------- */
        root.querySelectorAll('.ql-size-small').forEach(el => {
            el.style.fontSize = '0.75em';
        });

        root.querySelectorAll('.ql-size-large').forEach(el => {
            el.style.fontSize = '1.5em';
        });

        root.querySelectorAll('.ql-size-huge').forEach(el => {
            el.style.fontSize = '2.5em';
        });

        /* --------------------
        * COLORS
        * -------------------- */
        const colors = {
            red: '#e60000',
            orange: '#f90',
            yellow: '#ff0',
            green: '#008a00',
            blue: '#06c',
            purple: '#93f',
            white: '#fff',
            black: '#000'
        };

        Object.entries(colors).forEach(([name, value]) => {
            root.querySelectorAll(`.ql-color-${name}`).forEach(el => {
                el.style.color = value;
            });

            root.querySelectorAll(`.ql-bg-${name}`).forEach(el => {
                el.style.backgroundColor = value;
            });
        });

        /* --------------------
        * BLOCKQUOTE
        * -------------------- */
        root.querySelectorAll('blockquote').forEach(el => {
            el.style.borderLeft = '4px solid #ccc';
            el.style.paddingLeft = '16px';
            el.style.margin = '5px 0';
        });

        /* --------------------
        * CODE BLOCKS
        * -------------------- */
        root.querySelectorAll('pre, .ql-code-block-container').forEach(el => {
            el.style.fontFamily = 'monospace';
            el.style.backgroundColor = '#23241f';
            el.style.color = '#f8f8f2';
            el.style.padding = '6px 10px';
            el.style.borderRadius = '3px';
            el.style.margin = '5px 0';
        });

        root.querySelectorAll('code').forEach(el => {
            el.style.backgroundColor = '#f0f0f0';
            el.style.padding = '2px 4px';
            el.style.borderRadius = '3px';
            el.style.fontSize = '85%';
        });

        /* --------------------
        * TABLES
        * -------------------- */
        root.querySelectorAll('table').forEach(table => {
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
        });

        root.querySelectorAll('td').forEach(td => {
            td.style.border = '1px solid #000';
            td.style.padding = '2px 5px';
        });

        /* --------------------
        * LISTS (Approximation)
        * -------------------- */
        root.querySelectorAll('li').forEach(li => {
            li.style.marginLeft = '20px';
        });

        root.querySelectorAll('li[data-list="bullet"]').forEach(li => {
            li.style.listStyleType = 'disc';
        });

        root.querySelectorAll('li[data-list="ordered"]').forEach(li => {
            li.style.listStyleType = 'decimal';
        });

        /* --------------------
        * INDENTATION
        * -------------------- */
        for (let i = 1; i <= 9; i++) {
            root.querySelectorAll(`.ql-indent-${i}`).forEach(el => {
                el.style.paddingLeft = `${i * 3}em`;
            });
        }

        /* --------------------
        * RTL
        * -------------------- */
        root.querySelectorAll('.ql-direction-rtl').forEach(el => {
            el.style.direction = 'rtl';
            el.style.textAlign = 'right';
        });

        /* --------------------
        * LINKS & IMAGES
        * -------------------- */
        root.querySelectorAll('a').forEach(el => {
            el.style.color = '#06c';
            el.style.textDecoration = 'underline';
        });

        root.querySelectorAll('img, video').forEach(el => {
            el.style.maxWidth = '100%';
            el.style.display = 'block';
        });

        return root.innerHTML;
    }

    function downloadAsPdf()
    {
        const htmlContent = getPdfReadyHtml();

        const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');

        pdf.html(htmlContent, {
            callback: function (pdf) {
                // Save the PDF
                pdf.save(getPdfFileName());
            },
            x: 10,
            y: 10,
            width: 180, // Max width of the content on the page
            windowWidth: 800
        });
    }

    function saveHTML() {
        var deltaContent = quill.getContents();
        var cfg = {};
        var converter = new QuillDeltaToHtmlConverter(deltaContent['ops'], cfg);
        var htmlContent = converter.convert();
        downloadHTML(htmlContent);
    }

    function downloadHTML(content) {
        var blob = new Blob([content], { type: 'text/html' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Rich-Notes-' + getCurrentDate() + '.htm';
        link.click();
    }

    function getPdfFileName() {
        return 'Rich-Notes-' + getCurrentDate() + '.pdf';
    }

    function getCurrentDate() {
        const currentDate = new Date();
    
        return currentDate.getDate() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getFullYear();
    }
});