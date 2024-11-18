var topicParentSelector = "div#metadata_topicClassification";
var descriptionParentSelector = "div#metadata_dsDescription";
var topicSelector = "span[data-cvoc-protocol='dfgClassification']";
var topicInputSelector = "input[data-cvoc-protocol='dfgClassification']";

$(document).ready(function() {
    var style = $("<style>");    
    style.text(`
        .highlighted-selection {
            background-color: #f0f8ff !important;
            font-weight: bold !important;
        }
    `);    
    $("head").append(style);

    expandDFGclass();
    observeDomChanges();
});

function expandDFGclass() {
    $(topicParentSelector).each(function() {
        var parentElement = $(topicParentSelector).parent();
        var fieldValuesElement = parentElement.siblings('.dataset-field-values');
        var compoundFieldElement = fieldValuesElement.find('.edit-compound-field');
            
        compoundFieldElement.each(function() {
            var topicElement = $(this);
            if (topicElement.children().length > 2) {
                var topicClassInput = topicElement.children().eq(0).find('input');
                var topicClassVocab = topicElement.children().eq(1).find('input');
                var topicClassTermURI = topicElement.children().eq(2).find('input');

                updateDFGclassInputs(topicElement, topicClassInput, topicClassVocab, topicClassTermURI);

                executeDAFDM(topicElement);
            }
        });
    });
}

function updateDFGclassInputs(topicElement, topicClassInput, topicClassVocab, topicClassTermURI) {
    $(topicElement).find(topicInputSelector).each(function() {
        var topicInput = this;

        if (!topicInput.hasAttribute('data-topic')) {
            // Random identifier added
            let num = Math.floor(Math.random() * 100000000000);
            $(topicInput).hide();
            $(topicInput).attr('data-topic', num);

            // Add a select2 element to allow search and provide a list of choices
            var selectId = "topicAddSelect_" + num;
            $(topicInput).after('<select id="' + selectId + '" class="form-control add-resource select2" tabindex="-1" aria-hidden="true"></select>');

            $("#" + selectId).select2({
                theme: "classic",
                tags: $(topicInput).attr('data-cvoc-allowfreetext') === "true",
                delay: 500,
                templateResult: function(item) {
                    if (item.loading) {
                        return item.text;
                    }

                    // markMatch bolds the search term if/where it appears in the result
                    var $result = markMatch(item.text, term);
                    return $result;
                },
                templateSelection: function(item) {
                    // Autofill the corresponding values                
                    if (item.iri) {
                        $(topicClassTermURI).val(item.iri);
                        $(topicClassVocab).val("dfgfo2024");
                    }

                    if (item.text) {
                        var topicName = item.text;
                    }
                    else{
                        var topicName = $(topicClassInput).val();
                    }                    
                    item.text = topicName;
                    
                    if (item.text) {
                        return item.text;
                    }
                    else{
                        return item.id;
                    }
                },
                language: {
                    searching: function(params) {
                        return 'Search by a topic name';
                    }
                },
                placeholder: topicInput.hasAttribute("data-cvoc-placeholder") ? $(topicInput).attr('data-cvoc-placeholder') : "Select a DFG Topic Classification",
                minimumInputLength: 3,
                allowClear: true,
                ajax: {
                    url: function(params) {
                        var term = params.term;
                        if (!term) {
                            term = "";
                        }
                        // Use expanded-search to get the names, affiliations directly in the results
                        return "https://service.tib.eu/ts4tib/api/select";
                    },
                    dataType: 'json',
                    delay: 500,
                    data: function(params) {
                        term = params.term;
                        if (!term) {
                            term = "";
                        }
                        var queryParams = {
                            q: params.term,
                            exclusiveFilter: false,
                            ontology: 'dfgfo2024',
                            obsoletes: false,
                            local: false,
                            rows: 10
                        };
                
                        // // Construct the full URL with query parameters and log it
                        // var baseUrl = 'https://service.tib.eu/ts4tib/api/select';
                        // var urlWithParams = baseUrl + '?' + $.param(queryParams);
                        // console.log("API URL:", urlWithParams);
                
                        return queryParams;
                    },
                    processResults: function(data) {
                        // Map data to select2 format
                        var results = data.response.docs.map(function(item) {
                            return {
                                id: item.id,
                                iri: item.iri,
                                text: item.label + " (" + item.short_form + ")",
                                name: item.label,
                                onto_name: item.ontology_prefix,
                                class_no: item.short_form
                            };
                        });
                        return {
                            results: results
                        };
                    }
                }
            });

            // Handle existing values
            var topicName = $(topicInput).val();
            if (topicName) {
                var newOption = new Option(topicName, topicName, true, true);
                $('#' + selectId).append(newOption).trigger('change');
            }

            // When a selection is made, set the value of the hidden input field
            $('#' + selectId).on('select2:select', function(e) {
                var data = e.params.data;
                // For free-texts, the id and text are the same. Otherwise, different
                if (data.id !== data.text) {
                    var topicName = data.name;
                    data.name = topicName;
                    $("input[data-topic='" + num + "']").val(data.name);
                } else {
                    // Tags are allowed, so just enter the text as is
                    $("input[data-topic='" + num + "']").val(data.id);
                }
            });

            // When a selection is cleared, clear the hidden input and all corresponding inputs
            $('#' + selectId).on('select2:clear', function(e) {
                $("input[data-topic='" + num + "']").val('');
                $(topicClassVocab).val('');
                $(topicClassTermURI).val('');

                // Clear the topicInput value and set the placeholder text
                $(topicClassInput).val('');
                console.log($(topicClassInput).val())
                
                // Determine the placeholder value
                var placeholderText = topicInput.hasAttribute("data-cvoc-placeholder") 
                ? $(topicInput).attr('data-cvoc-placeholder') 
                : "Select a DFG Topic Classification";
                $(topicClassInput).attr('placeholder', placeholderText);
            });
        }
    });
}

// Put the text in a result that matches the term in a span with class select2-rendered__match that can be styled
function markMatch(text, term) {
    var match = text.toUpperCase().indexOf(term.toUpperCase());
    var $result = $('<span></span>');
    
    // If there is no match, move on
    if (match < 0) {
        return $result.text(text);
    }
    $result.text(text.substring(0, match));
    
    // Put in whatever text is before the match
    var $match = $('<span class="select2-rendered__match"></span>');
    
    // Mark and append the matching text
    $match.text(text.substring(match, match + term.length));
    $result.append($match);
    
    // Put in whatever is after the match
    $result.append(text.substring(match + term.length));
    return $result;
}

function executeDAFDM(topicElement) {
    var button = $('<button type="button" class="btn btn-secondary">Try DAFDM</button>');   
    
    button.on('click', function() {
        // alert("Button clicked");   
        var baseUrl = "https://services.eurospider.com/fdm-upload/rest";
        var url = `${baseUrl}/suggestions`;

        // Preparing the querytext
        var allDsInputValues = [];

        $(descriptionParentSelector).each(function() {
            var dsParentElement = $(descriptionParentSelector).parent();
            var dsFieldValuesElement = dsParentElement.siblings('.dataset-field-values');
            var dsCompoundFieldElement = dsFieldValuesElement.find('.edit-compound-field');

            dsCompoundFieldElement.each(function() {
                var dsElement = $(this);
                var dsInput = dsElement.children().children().eq(2);
                var dsInputValue = $(dsInput).val();

                if (dsInputValue) {
                    allDsInputValues.push(dsInputValue);
                }
            });
        });

        var queryText = allDsInputValues.join(" ");
        console.log("Merged queryText:", queryText);

        // // Prepare the request body
        // var requestBody = {
        //     query: queryText,
        //     resultSize: 5
        // };

        // // Perform the AJAX POST request
        // $.ajax({
        //     url: url,
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json",
        //         "Api-Key": "xhdvERDHJL83qQUsMS4kAm6XrnNWYKu"
        //     },
        //     data: JSON.stringify(requestBody),
        //     success: function(response) {
        //         console.log("Suggestions Response:", response);
        //     },
        //     error: function(xhr, status, error) {
        //         console.error("Error in suggestions request:", error);
        //     }
        // });

        // Mock JSON response
        var mockResponse = {
            "data": [
                {"value": "dfg-fs$407-01", "score": 1.0},
                {"value": "dfg-fs$310-01", "score": 0.5}
            ],
            "error": null,
            "state": "OK",
            "message": null
        };

        // Sort the data based on the score in descending order
        mockResponse.data.sort((a, b) => b.score - a.score);

        var modalContent = `<ul>`;
        var fetchPromises = [];

        mockResponse.data.forEach(item => {
            var extractedValue = item.value.split("$")[1] || item.value;

            var dataParams = {
                q: extractedValue,
                exclusiveFilter: false,
                ontology: "dfgfo",
                obsoletes: false,
                local: false,
                rows: 1
            };

            var fullQueryUrl = "https://service.tib.eu/ts4tib/api/select" + "?" + $.param(dataParams);
            var fetchPromise = $.ajax({
                url: fullQueryUrl, 
                method: "GET",
                dataType: "json"
            }).then(function (response) {
                var label = response.response?.docs[0]?.label || "Unknown Label";
                var labeliri = response.response?.docs[0]?.iri || "";
                modalContent += `
                    <li data-value="${item.value}" 
                        data-labeliri="${labeliri}"
                        class="suggestion-item">
                        ${label} (${item.value.split("$")[1] || item.value})
                    </li>`;
            }).catch(function (error) {
                console.error(`Error fetching label for ${item.value}:`, error);
                modalContent += `
                    <li data-value="${item.value}" 
                        data-labeliri=""
                        class="suggestion-item">
                        Error fetching label (${item.value.split("$")[1] || item.value})
                    </li>`;
            });
            fetchPromises.push(fetchPromise);
        });

        // Wait for all fetches to complete and then show modal
        Promise.all(fetchPromises).then(() => {
            modalContent += `</ul>`;

            var modalHtml = `
                <div class="modal fade" id="dafdmModal" tabindex="-1" role="dialog" aria-labelledby="dafdmModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="dafdmModalLabel">DAFDM Suggestions</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                ${modalContent}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            $('body').append(modalHtml);
            $('#dafdmModal').modal('show');

            // Clean up the modal after it is hidden
            $('#dafdmModal').on('hidden.bs.modal', function () {
                $(this).remove();
            });

            // Add click event to each suggestion item in the modal
            $('.suggestion-item').on('click', function() {
                $('.suggestion-item').removeClass('highlighted-selection');
                $(this).addClass('highlighted-selection');
                
                var selectedValue = $(this).data('label');
                var selectediri = $(this).data('labeliri');
                console.log(topicElement.children().eq(0));
                var topicClassInput = topicElement.children().eq(0).find('input');
                var topicClassVocab = topicElement.children().eq(1).find('input');
                var topicClassTermURI = topicElement.children().eq(2).find('input');
                console.log(topicClassInput);
                
                $(topicClassInput).val(selectedValue);  
                $(topicClassVocab).val("dfgfo");
                $(topicClassTermURI).val(selectediri);               
                
                $('#dafdmModal').modal('hide');
            });
        });
    });
    
    // Append the button after the topicElement
    topicElement.append(button);
}

function observeDomChanges() {
    var targetNode = document.querySelector("body");
    var observer = new MutationObserver(function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                console.log("DOM change detected, reloading...");
                observer.disconnect();  // Stop observing after the first mutation
                location.reload(); // Reload the page
                break;
            }
        }
    });

    var config = { childList: true, subtree: true, attributes: true };
    observer.observe(targetNode, config);
}