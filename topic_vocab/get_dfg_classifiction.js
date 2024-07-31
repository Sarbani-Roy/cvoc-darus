var topicParentSelector = "div#metadata_topicClassification";
var topicSelector = "span[data-cvoc-protocol='dfgTopicClass']";
var topicInputSelector = "input[data-cvoc-protocol='dfgTopicClass']";

$(document).ready(function() {
    expandPeople();
});

function expandPeople() {
    $(topicParentSelector).each(function() {
        var parentElement = $(topicParentSelector).parent();
        var fieldValuesElement = parentElement.siblings('.dataset-field-values');
        var compoundFieldElement = fieldValuesElement.find('.edit-compound-field');
            
        compoundFieldElement.each(function() {
            var topicElement = $(this);
            if (topicElement.children().length > 2) {
                var topicClassValue = topicElement.children().eq(0).find('input');
                var topicClassVocab = topicElement.children().eq(1).find('input');
                var topicClassVocabURI = topicElement.children().eq(2).find('input');

                updatePeopleInputs(topicElement, topicClassValue, topicClassVocab, topicClassVocabURI);
            }
        });
    });
}

function updatePeopleInputs(topicElement, topicClassValue, topicClassVocab, topicClassVocabURI) {
    $(topicElement).find(topicInputSelector).each(function() {
        var topicInput = this;
        console.log(topicInput);

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
                    console.log(item);
                    if (item.loading) {
                        return item.text;
                    }

                    // markMatch bolds the search term if/where it appears in the result
                    var $result = markMatch(item.text, item.term);
                    return $result;
                },
                templateSelection: function(item) {
                    var topicClass = $(topicClassValue).val() === "" && item.name ? item.name : $(topicClassValue).val();
                    $(topicClassVocab).val("");
                    $(topicClassVocabURI).val("");

                    item.text = topicClass;
                    return item.text;
                },
                language: {
                    searching: function(params) {
                        return 'Search by name, email, or ORCID…';
                    }
                },
                placeholder: topicInput.hasAttribute("data-cvoc-placeholder") ? $(topicInput).attr('data-cvoc-placeholder') : "Select an Author",
                minimumInputLength: 3,
                allowClear: true,
                ajax: {
                    transport: function(params, success, failure) {
                        $.getJSON('__dataverse_previewers__/js/dfg-2024.json', function(data) {
                            var processedResults = data.map(function(item) {
                                return {
                                    text: item['prefLabel@en'] + " (" + item['notation'] + ")",
                                    name: item['prefLabel@en'],
                                    id: item['notation']
                                };
                            });
                            success({
                                results: processedResults
                            });
                        }).fail(failure);
                    },
                    processResults: function(data, params) {
                        return {
                            results: data.results
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
                $(topicClassVocab).val("");
                $(topicClassVocabURI).val("");
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