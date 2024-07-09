var authorParentSelector = "div#metadata_author";
var personSelector = "span[data-cvoc-protocol='orcid']";
var personInputSelector = "input[data-cvoc-protocol='orcid']";

$(document).ready(function() {
    expandPeople();
});

function expandPeople() {
    $(authorParentSelector).each(function() {
        var parentElement = $(authorParentSelector).parent();
        var fieldValuesElement = parentElement.siblings('.dataset-field-values');
        var compoundFieldElement = fieldValuesElement.find('.edit-compound-field'); // Select all children with class 'edit-compound-field'
            
        compoundFieldElement.each(function() {
            var authorElement = $(this);
            if (authorElement.children().length > 3) {
                var authorNameInput = authorElement.children().eq(0).find('input');
                var authorAffiliation = authorElement.children().eq(1).find('input');
                var authorIdentifierSchemeText = authorElement.children().eq(2).find('.ui-selectonemenu-label');
                var authorIdentifierSchemeSelect = authorElement.children().eq(2).find('select').get(0);
                var authorIdentifier = authorElement.children().eq(3).find('input');

                updatePeopleInputs(authorElement, authorIdentifier, authorIdentifierSchemeSelect, authorIdentifierSchemeText, authorAffiliation, authorNameInput);
            }
        });
    });
}

function updatePeopleInputs(authorElement, authorIdentifier, authorIdentifierSchemeSelect, authorIdentifierSchemeText, authorAffiliation, authorNameInput) {
    $(authorElement).find(personInputSelector).each(function() {
        var personInput = this;
        if (!personInput.hasAttribute('data-person')) {
            // Random identifier added
            let num = Math.floor(Math.random() * 100000000000);
            $(personInput).hide();
            $(personInput).attr('data-person', num);
            
            // Add a select2 element to allow search and provide a list of choices
            var selectId = "personAddSelect_" + num;
            $(personInput).after('<select id=' + selectId + ' class="form-control add-resource select2" tabindex="-1" aria-hidden="true">');
            $("#" + selectId).select2({
                theme: "classic",
                tags: $(personInput).attr('data-cvoc-allowfreetext'),
                delay: 500,
                templateResult: function(item) {
                    
                    // No templating right now
                    if (item.loading) {
                        return item.text;
                    }
                    
                    // markMatch bolds the search term if/where it appears in the result
                    var $result = markMatch(item.text, term);
                    return $result;
                },
                templateSelection: function(item) {
                    console.log("item:", item)
                    // Fill otherfields with marked item
                    var pos = item.text.search(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/);
                    if (pos >= 0) {
                        var orcid = item.text.substr(pos, 19);
                        $(authorIdentifier).val(orcid);
                        let option = Array.from(authorIdentifierSchemeSelect.querySelectorAll('option')).find(el => el.text === 'ORCID');
                        if (option) {
                            $(authorIdentifierSchemeSelect).val(option.value);
                            $(authorIdentifierSchemeText).text("ORCID");
                        }    
                        if ($(authorAffiliation).val() === "" && item.affiliation) {
                            $(authorAffiliation).val(item.affiliation)
                        }
                    }
                    // var authorName = item.text.split(',')[0];
                    if ($(authorNameInput).val() === "" && item.name) {
                        var authorName = item.name
                    }
                    else{
                        var authorName = (authorNameInput).val()
                    }
                    item.name = authorName
                    console.log(item.name)
                    // return item.text;
                    if (item.name) {
                        // item.name = authorName;
                        console.log(item.name)
                        return item.name;
                    }
                    else{
                        return item.id;
                    }
                },
                language: {
                    searching: function(params) {
                        // Copied this block from dataverse example
                        return 'Search by name, email, or ORCID…';
                    }
                },
                placeholder: personInput.hasAttribute("data-cvoc-placeholder") ? $(personInput).attr('data-cvoc-placeholder') : "Select an Author",
                minimumInputLength: 3,
                allowClear: true,
                ajax: {
                    // Use an ajax call to ORCID to retrieve matching results
                    url: function(params) {
                        var term = params.term;
                        if (!term) {
                            term = "";
                        }
                        // Use expanded-search to get the names, affiliations directly in the results
                        return "https://pub.orcid.org/v3.0/expanded-search";
                    },
                    data: function(params) {
                        term = params.term;
                        if (!term) {
                            term = "";
                        }
                        var query = {
                            q: term,
                            rows: 10
                        };
                        return query;
                    },
                    headers: {
                        'Accept': 'application/json'
                    },
                    processResults: function(data, page) {
                        return {
                            results: data['expanded-result']
                                //Sort to bring recently used ORCIDS to the top of the lis
                                .sort((a, b) => (localStorage.getItem(b['orcid-id'])) ? 1 : 0)
                                .map(function(x) {
                                    // Institution names by using the last one
                                    let institutionNames = x['institution-name'];
                                    let lastInstitution = Array.isArray(institutionNames) ? institutionNames[institutionNames.length - 1] : "";
                                    return {
                                        text: x['given-names'] + " " + x['family-names'] +
                                            ", " +
                                            x['orcid-id'] +
                                            (lastInstitution ? ", " + lastInstitution : ""),
                                        name: capitalizeFirstLetter(x['family-names']) + ", " + capitalizeFirstLetter(x['given-names']),
                                        id: x['orcid-id'],
                                        // Copied this line from dataverse example
                                        title: 'Open in new tab to view ORCID page',
                                        affiliation: lastInstitution
                                    };
                                })
                        };
                    }
                }
            });

            // If the Identifier and IdentifierScheme has values already, format it the same way as if it were a new selection
            var authorName = $(personInput).val()
            var idScheme = $(authorIdentifierSchemeText).text()
            var id = $(authorIdentifier).val()
            if (id && id.startsWith("https://orcid.org/")) {
                id = id.substring(18);
            }

            if (id && idScheme === 'ORCID'){
                $.ajax({
                    type: "GET",
                    url: "https://pub.orcid.org/v3.0/" + id + "/person",
                    dataType: 'json',
                    headers: {
                        'Accept': 'application/json'
                    },
                    success: function(person, status) {
                        var name =  capitalizeFirstLetter(person.name['family-name'].value) + ", " + capitalizeFirstLetter(person.name['given-names'].value);  
                        var text = name + ", " + id;
                        var newOption = new Option(text, id, true, true);
                        newOption.title = 'Open in new tab to view ORCID page';
                        $('#' + selectId).append(newOption).trigger('change');
                    },
                    failure: function(jqXHR, textStatus, errorThrown) {
                        if (jqXHR.status != 404) {
                            console.error("The following error occurred: " + textStatus, errorThrown);
                        }
                    }
                });
            }
            else {
                //If the initial value (Identifier and IdentifierScheme) is not an ORCID (legacy, or if tags are enabled), just display it as is 
                console.log("No ORCID id")
                console.log(authorName)
                var newOption = new Option(authorName, authorName, true, true);
                $('#' + selectId).append(newOption).trigger('change');
            }

            // When a selection is made, set the value of the hidden input field
            $('#' + selectId).on('select2:select', function(e) {
                var data = e.params.data;
                console.log("data at select", data)
                //For free-texts, the id and text are same. Otherwise different
                if (data.id != data.text) {
                    var authorName = data.name;
                    data.name = authorName;
                    $("input[data-person='" + num + "']").val(data.name);
                } else {
                    console.log("Author Name for free text entry", data.id)
                    //Tags are allowed, so just enter the text as is
                    $("input[data-person='" + num + "']").val(data.id);
                }
            });

            
            // When a selection is cleared, clear the hidden input and all corresponding inputs
            $('#' + selectId).on('select2:clear', function(e) {
                $("input[data-person='" + num + "']").attr('value', '');

                $(authorIdentifier).val('');
                let option = Array.from(authorIdentifierSchemeSelect.querySelectorAll('option')).find(el => el.text === 'Select...');
                if (option) {
                    $(authorIdentifierSchemeSelect).val(option.value);
                    $(authorIdentifierSchemeText).text(option.text);
                }    
                $(authorAffiliation).val('');
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

function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
