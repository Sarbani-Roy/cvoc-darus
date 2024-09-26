var grantNumberParentSelector = "div#metadata_grantNumber";
var projectInfParentSelector = "div#metadata_project";
var projectSelector = "span[data-cvoc-protocol='fis']";
var projectInputSelector = "input[data-cvoc-protocol='fis']";

$(document).ready(function() {
    expandProject();
});

function expandProject() {
    $(projectInfParentSelector).each(function() {
        var projectParentElement = $(projectInfParentSelector).parent();
        var projectFieldValuesElement = projectParentElement.siblings('.dataset-field-values');
        var projectCompoundFieldElement = projectFieldValuesElement.find('.edit-compound-field'); // Select all children with class 'edit-compound-field'
            
        projectCompoundFieldElement.each(function() {
            var projectElement = $(this);
            
            if (projectElement.children().length > 3) {
                var projectNameInput = projectElement.children().eq(0).find('input');
                var projectAcronymInput = projectElement.children().eq(1).find('input');
                // var projectAcronym = fundingElement.children().eq(1)
                var fisIdentifier = projectElement.children().eq(3);
                var fisIdentifierInput = projectElement.children().eq(3).find('input');
                
                $(grantNumberParentSelector).each(function() {
                    var parentElement = $(grantNumberParentSelector).parent();
                    var fieldValuesElement = parentElement.siblings('.dataset-field-values');
                    var compoundFieldElement = fieldValuesElement.find('.edit-compound-field'); // Select all children with class 'edit-compound-field'
                        
                    compoundFieldElement.each(function() {
                        var fundingElement = $(this);
                        
                        if (fundingElement.children().length > 2) {
                            var fundingAgency = fundingElement.children().eq(0).find('input');
                            var projectGrantAcronymInput = fundingElement.children().eq(1).find('input');
                            // var fundingIdentifier = fundingElement.children().eq(3).find('input');

                            updateGrantInputs(projectElement, projectNameInput, projectAcronymInput, fisIdentifier, fisIdentifierInput, fundingElement, projectGrantAcronymInput, fundingAgency);                        
                        }
                    });

                });
                
            }
        });
    });
}

function updateGrantInputs(projectElement, projectNameInput, projectAcronymInput, fisIdentifier, fisIdentifierInput, fundingElement, projectGrantAcronymInput, fundingAgency) {

    $(projectElement).find(projectInputSelector).each(function() {
        var projectInput = this;
        
        if (!projectInput.hasAttribute('data-project')) {
            // Random identifier added
            let num = Math.floor(Math.random() * 100000000000);
            $(projectInput).hide();
            $(projectInput).attr('data-project', num);
            $(fisIdentifier).hide()
            
        // Add a select2 element to allow search and provide a list of choices
            var selectId = "projectAddSelect_" + num;
            
            $(projectInput).after('<select id=' + selectId + ' class="form-control add-resource select2" tabindex="-1" aria-hidden="true">');
            $("#" + selectId).select2({
                theme: "classic",
                tags: $(projectInput).attr('data-cvoc-allowfreetext'),
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

                    console.log(item.text)
                    
                    // Prevent multiple executions
                    if (item.processed) {
                        console.log(item.text)
                        return item.text;
                    }
                    item.processed = true;
                    
                    if (item.funding_orgs && item.funding_orgs.length > 1) {
                        if ($(fundingAgency).val() === "") {
                            
                            // Recursive function to handle async DOM update after each click
                            function updateFundingOrgs(i) {
                                if (i >= item.funding_orgs.length) return;  // Exit condition
                    
                                $(grantNumberParentSelector).each(function() {
                                    var newParentElement = $(grantNumberParentSelector).parent();
                                    var newFieldValuesElement = newParentElement.siblings('.dataset-field-values');
                                    var newFundingElement = newFieldValuesElement.children().eq(2 * i);
                    
                                    var newFundingAgency = newFundingElement.children().eq(0).find('input');
                                    var newProjectGrantAcronymInput = newFundingElement.children().eq(1).find('input');
                                    $(newFundingAgency).val(item.funding_orgs[i].cfacro);
                                    $(newProjectGrantAcronymInput).val(item.acronym);
                                    
                                    if (i < item.funding_orgs.length - 1) {
                                        newFundingElement.next('.field-add-delete').children().eq(0).click();
                    
                                        // Wait for DOM update, then call the function recursively for the next iteration
                                        setTimeout(function() {
                                            updateFundingOrgs(i + 1);  // Call the function recursively for the next item
                                        }, 500);  // Adjust delay if necessary
                                    }
                                });
                            }
                    
                            // Start recursion from the first item
                            updateFundingOrgs(0);
                        }
                    } 
                    
                    else if (item.funding_orgs) {

                        emptyFundingElementFound = false;

                        console.log(emptyFundingElementFound)

                        var newParentElement = $(grantNumberParentSelector).parent();
                        var newFieldValuesElement = newParentElement.siblings('.dataset-field-values');
                        var newCompoundFundingElement = newFieldValuesElement.find('.edit-compound-field');

                        newCompoundFundingElement.each(function(index) {
                            var newFundingElement = $(this);
                            var newFundingAgency = newFundingElement.children().eq(0).find('input');
                            var newProjectGrantAcronymInput = newFundingElement.children().eq(1).find('input');

                            if ($(newFundingAgency).val() === '' && $(newProjectGrantAcronymInput).val() === '') {
                                emptyFundingElementFound = true;

                                if (item.funding_orgs[0] && item.acronym){
                                    $(newFundingAgency).val(item.funding_orgs[0].cfacro);
                                    $(newProjectGrantAcronymInput).val(item.acronym);
                                }
                            }
                        });

                        // If no empty funding element was found, add a new one by clicking '+'
                        if (emptyFundingElementFound == false) {
                            emptyFundingElementFound = true;
                            newCompoundFundingElement.last().next('.field-add-delete').children().eq(0).click();
                            
                            setTimeout(function() {
                                var addedFieldValuesElement = newParentElement.siblings('.dataset-field-values').last();

                                var addedFundingAgency = addedFieldValuesElement.find('.edit-compound-field').last().children().eq(0).find('input');
                                var addedProjectGrantAcronymInput = addedFieldValuesElement.find('.edit-compound-field').last().children().eq(1).find('input');

                                $(addedFundingAgency).val(item.funding_orgs[0].cfacro);
                                $(addedProjectGrantAcronymInput).val(item.acronym);
                            }, 500);
                        }
                    }

                    if (item.acronym){
                        $(projectAcronymInput).val(item.acronym);
                    }     
                    if (item.id && item.text != item.id) {
                        $(fisIdentifierInput).val(item.id);
                    }                                                      
                    if ($(projectNameInput).val() === "" && item.text) {
                        var projectName = item.text;
                    }
                    else{
                        var projectName = $(projectNameInput).val();
                    }                    
                    item.text = projectName;

                    fisid = $(fisIdentifierInput).val()

                    // if(fisid){
                    //     return $('<span></span>').append(item.text.replace(projectName, "<a href=' https://fis-qs.campus.uni-stuttgart.de/converis/portal/detail/Project/" + fisid + "'>" + projectName + "</a>"));
                    // }

                    if (item.text) {
                        return item.text;
                    }
                    else{
                        return item.id;
                    }
                },
                language: {
                    searching: function(params) {
                        // Copied this block from dataverse example
                        return 'Search by project name';
                    }
                },
                placeholder: projectInput.hasAttribute("data-cvoc-placeholder") ? $(projectInput).attr('data-cvoc-placeholder') : "Select a project",
                minimumInputLength: 3,
                allowClear: true,
                ajax: {
                    // Use an ajax call to ORCID to retrieve matching results
                    url: function(params) {
                        var term = params.term;
                        if (!term) {
                            term = "";return $('<span></span>').append(item.text.replace(projectName, "<a href=' https://fis-qs.campus.uni-stuttgart.de/converis/portal/detail/Project/" + item.id + "'>" + projectName + "</a>"));
                    
                        }
                        // Use expanded-search to get the names, affiliations directly in the results
                        return "https://fis-qs.campus.uni-stuttgart.de/openfis/api/extern/projects";
                    },
                    data: function(params) {
                        term = `title=${params.term}`;
                        if (!term) {
                            term = "";
                        }
                        var query = {
                            q: term,
                            rows: 10
                        };
                        return term;
                    },
                    headers: {
                        'Accept': 'application/json'
                    },
                    processResults: function(data, page) {
                        return {
                            results: data['data_elements']
                                .map(function(element) {
                                    // Access the project information within each data element
                                    let projectInfo = element.project;
                                    // Returning the desired structure
                                    return {
                                        text: projectInfo.title_de, //+ " (" + projectInfo.acronym + ")",
                                        acronym: projectInfo.acronym,
                                        agency: projectInfo.foerderkennzeichen,
                                        id: projectInfo.id,
                                        funding_orgs: element.funding_org
                                    };
                                })
                            }
                        }
                    }
            });

            // format it the same way as if it were a new selection
            var projectName = $(projectNameInput).val()
            var newOption = new Option(projectName, projectName, true, true);
            $('#' + selectId).append(newOption).trigger('change');


            // When a selection is made, set the value of the hidden input field
            $('#' + selectId).on('select2:select', function(e) {
                var data = e.params.data;

                //For free-texts, the id and text are same. Otherwise different
                if (data.id != data.text) {
                    var projectName = data.text;
                    data.text = projectName;
                    $("input[data-project='" + num + "']").val(data.text);
                } else {
                    //Tags are allowed, so just enter the text as is
                    $("input[data-project='" + num + "']").val(data.id);
                }
            });

            
            // When a selection is cleared, clear the hidden input and all corresponding inputs
            $('#' + selectId).on('select2:clear', function(e) {
                $("input[data-project='" + num + "']").attr('value', '');
                var oldProjectGrantAcronymInput = $(projectAcronymInput).val();
                
                // $(projectNameInput).val(''); 
                $(projectAcronymInput).val('');
                $(fisIdentifierInput).val('')
                
                $(grantNumberParentSelector).each(function() {
                    var clearParentElement = $(grantNumberParentSelector).parent();
                    var clearFieldValuesElement = clearParentElement.siblings('.dataset-field-values');
                    var clearCompoundFundingElement = clearFieldValuesElement.find('.edit-compound-field');
                    clearCompoundFundingElement.each(function() {
                        var clearFundingElement = $(this);
                        var clearFundingAgency = clearFundingElement.children().eq(0).find('input');
                        var clearProjectGrantAcronymInput = clearFundingElement.children().eq(1).find('input');
                        if($(clearProjectGrantAcronymInput).val() == oldProjectGrantAcronymInput) {
                            $(clearFundingAgency).val('');
                            $(clearProjectGrantAcronymInput).val('');

                            setTimeout(function() {
                                if (clearFundingElement.siblings('.field-add-delete').children().eq(1)) {
                                    clearFundingElement.siblings('.field-add-delete').children().eq(1).click();
                                }
                            }, 500);
                        }
                    });
                });
            });
        }
    })
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