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
        var projectCompoundFieldElement = projectFieldValuesElement.find('.edit-compound-field');
            
        projectCompoundFieldElement.each(function() {
            var projectElement = $(this);
            
            if (projectElement.children().length > 3) {
                var projectNameInput = projectElement.children().eq(0).find('input');
                var projectAcronymInput = projectElement.children().eq(1).find('input');
                var fisIdentifier = projectElement.children().eq(3);
                var fisIdentifierInput = projectElement.children().eq(3).find('input');
                
                $(grantNumberParentSelector).each(function() {
                    var parentElement = $(grantNumberParentSelector).parent();
                    var fieldValuesElement = parentElement.siblings('.dataset-field-values');
                    var compoundFieldElement = fieldValuesElement.find('.edit-compound-field');
                        
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

        // Declare previousAcronym outside the event handlers to make it accessible to both
        var previousAcronym = $(projectAcronymInput).val();

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
                    
                    // Prevent multiple executions
                    if (item.processed === true) {
                        return item.text;
                    }
                    item.processed = true;
                    
                    setTimeout(function() {
                        if (item.funding_orgs && item.funding_orgs.length > 1) {
                            var updatedParentElement = $(grantNumberParentSelector).parent();
                            var updatedFieldValuesElement = updatedParentElement.siblings('.dataset-field-values');
                            var updatedFundingElement = updatedFieldValuesElement.find('.edit-compound-field').last();

                            var updatedFundingAgency = updatedFundingElement.children().eq(0).find('input');
                            var updatedProjectGrantAcronymInput = updatedFundingElement.children().eq(1).find('input');
            
                            if ($(updatedFundingAgency).val() === "" && $(updatedProjectGrantAcronymInput).val() === "") {
                                updateFundingOrgs(0, item);
                            } else {
                                updatedFundingElement.next('.field-add-delete').children().eq(0).click();
                                setTimeout(function() {
                                    updateFundingOrgs(0, item);
                                }, 500);
                                // updateFundingOrgs(0, item);
                            }
                        } else if (item.funding_orgs) {
                            emptyFundingElementFound = false;

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
                                    var addedParentElement = $(grantNumberParentSelector).parent();
                                    var addedFieldValuesElement = addedParentElement.siblings('.dataset-field-values');
                                    var addedFieldValuesElement = addedParentElement.siblings('.dataset-field-values').last();

                                    var addedFundingAgency = addedFieldValuesElement.find('.edit-compound-field').last().children().eq(0).find('input');
                                    var addedProjectGrantAcronymInput = addedFieldValuesElement.find('.edit-compound-field').last().children().eq(1).find('input');

                                    $(addedFundingAgency).val(item.funding_orgs[0].cfacro);
                                    $(addedProjectGrantAcronymInput).val(item.acronym);
                                }, 500);
                            }
                        }
                    }, 500);

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

                    if (item.text) {
                        return item.text;
                    }
                    else{
                        return item.id;
                    }
                },
                language: {
                    searching: function(params) {
                        return 'Search by project name';
                    }
                },
                placeholder: projectInput.hasAttribute("data-cvoc-placeholder") ? $(projectInput).attr('data-cvoc-placeholder') : "Select a project",
                minimumInputLength: 3,
                allowClear: true,
                ajax: {
                    // Use an ajax call to FIS to retrieve matching results
                    cache: false,
                    url: function(params) {
                        var term = params.term;
                        if (!term) {
                            term = "";return $('<span></span>').append(item.text.replace(projectName, "<a href=' https://fis-qs.campus.uni-stuttgart.de/converis/portal/detail/Project/" + item.id + "'>" + projectName + "</a>"));
                        }
                        // return "https://fis-qs.campus.uni-stuttgart.de/openfis/api/extern/projects";
                        
                        // Search both title and acronym
                        var urlTitle = 'https://fis-qs.campus.uni-stuttgart.de/openfis/api/extern/projects/by?title=' + encodeURIComponent(term);
                        var urlAcronym = 'https://fis-qs.campus.uni-stuttgart.de/openfis/api/extern/projects/by?acronym=' + encodeURIComponent(term);
                        return [urlTitle, urlAcronym];
                    },
                    data: function(params) {
                        term = params.term
                        // term = `title=${params.term}`;
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
                    // Perform AJAX call for both title and acronym
                    transport: function(params, success, failure) {
                        var urls = params.url;
                        
                        // Make two parallel AJAX requests for title and acronym search
                        var titleRequest = $.ajax({ url: urls[0], headers: params.headers });
                        var acronymRequest = $.ajax({ url: urls[1], headers: params.headers });

                        // Wait for both AJAX requests to finish
                        $.when(titleRequest, acronymRequest).done(function(titleData, acronymData) {
                            // titleData[0] and acronymData[0] contain the actual data (due to how $.when works)
                            var combinedData = [].concat(titleData[0]['data_elements'], acronymData[0]['data_elements']);
                            // Pass combined data to the success callback
                            success({
                                results: combinedData.map(function(element) {
                                    let projectInfo = element.project;
                                    return {
                                        text: projectInfo.title_de, 
                                        acronym: projectInfo.acronym,
                                        agency: projectInfo.foerderkennzeichen,
                                        id: projectInfo.id,
                                        funding_orgs: element.funding_org,
                                        processed: false
                                    };
                                })
                            });
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            console.error("AJAX request failed:", textStatus, errorThrown);
                            failure(); // In case one or both requests fail, call the failure callback
                        }); 
                    },
                }
            });

            // format it the same way as if it were a new selection
            var projectName = $(projectNameInput).val();
            var newOption = new Option(projectName, projectName, true, true);
            $('#' + selectId).append(newOption).trigger('change');

            // Detect when the select2 dropdown is opened (user interaction)
            $("#" + selectId).on('select2:open', function(e) {
                previousAcronym = $(projectAcronymInput).val();
            });
            
            // When a selection is made, set the value of the hidden input field
            $('#' + selectId).on('select2:select', function(e) {
                var data = e.params.data;         
                var newAcronym = data.acronym;
                
                // If the previous acronym exists and differs from the new one, delete the grant info
                if (previousAcronym !== "" && previousAcronym !== newAcronym) {
                    setTimeout(function() {
                        deleteGrantInfo(previousAcronym);
                    }, 500);
                }

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
                $(projectAcronymInput).val('');
                $(fisIdentifierInput).val('');

                // Clear the projectNameInput value and set the placeholder text
                $(projectNameInput).val('');
                // Determine the placeholder value
                var placeholderText = projectInput.hasAttribute("data-cvoc-placeholder") 
                ? $(projectInput).attr('data-cvoc-placeholder') 
                : "Select a project";
                $(projectNameInput).attr('placeholder', placeholderText);

                setTimeout(function() {
                    deleteGrantInfo(oldProjectGrantAcronymInput);
                }, 500);
            });
        }
    })
}

// To get elements corresponding to funding details
function getFundingDetails(grantNumberParentSelector) {
    var fundingDetails = [];

    $(grantNumberParentSelector).each(function() {
        var parentElement = $(this).parent();
        var fieldValuesElement = parentElement.siblings('.dataset-field-values');
        var compoundFieldElement = fieldValuesElement.find('.edit-compound-field'); // Select all children with class 'edit-compound-field'
        
        compoundFieldElement.each(function() {
            var fundingElement = $(this);

            // Ensure the fundingElement has enough children
            if (fundingElement.children().length > 2) {
                var fundingAgency = fundingElement.children().eq(0).find('input');
                var projectGrantAcronymInput = fundingElement.children().eq(1).find('input');
                var deleteFundingElement = fundingElement.next('.field-add-delete').children().eq(1);

                // Store the funding agency and project acronym in the array
                fundingDetails.push({
                    deleteFundingElement: deleteFundingElement,
                    fundingAgency: fundingAgency,
                    projectGrantAcronym: projectGrantAcronymInput
                });
            }
        });
    });
    return fundingDetails;
}
               
// Recursive function to handle async DOM update after each click
function updateFundingOrgs(i, item) {
    if (i >= item.funding_orgs.length) return;  // Exit condition

    $(grantNumberParentSelector).each(function() {
        var newParentElement = $(grantNumberParentSelector).parent();
        var newFieldValuesElement = newParentElement.siblings('.dataset-field-values');
        var newFundingElement = newFieldValuesElement.find('.edit-compound-field').last();
        var newFundingAgency = newFundingElement.children().eq(0).find('input');
        var newProjectGrantAcronymInput = newFundingElement.children().eq(1).find('input');
        
        $(newFundingAgency).val(item.funding_orgs[i].cfacro);
        $(newProjectGrantAcronymInput).val(item.acronym);
        
        if (i < item.funding_orgs.length - 1) {
            newFundingElement.next('.field-add-delete').children().eq(0).click();

            setTimeout(function() {
                updateFundingOrgs(i + 1, item);
            }, 500);
        }
    });
}

function deleteGrantInfo(acronymToDelete) {                    
    var clearFundingDetails = getFundingDetails(grantNumberParentSelector);
                
    if (clearFundingDetails.length > 0) {
        function clearFundingOrgs(i) {
            if (i >= clearFundingDetails.length) return;
            index = 0;
            var clearFundingAgency = clearFundingDetails[i].fundingAgency;
            var clearProjectGrantAcronymInput = clearFundingDetails[i].projectGrantAcronym;
            
            if ($(clearProjectGrantAcronymInput).val() === acronymToDelete) {
                $(clearFundingAgency).val('');
                $(clearProjectGrantAcronymInput).val('');

                setTimeout(function() {
                    var clearFundingElement = clearFundingDetails[(i-index)].deleteFundingElement;
                    clearFundingElement.click();
                    index = index+1;
                    // setTimeout(function() {
                    //     index = index+1;
                    // }, 500);
                }, 500);
            }
            clearFundingOrgs(i + 1);
        }
        clearFundingOrgs(0);
    }
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