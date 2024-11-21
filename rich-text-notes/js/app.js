$(document).ready(function () {
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

    function downloadAsPdf()
    {
        var delta = quill.getContents();
        var htmlContent = quill.root.innerHTML;
        const pdf = new window.jspdf.jsPDF();

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