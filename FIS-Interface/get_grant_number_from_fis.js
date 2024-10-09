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
                var fisIdentifier = projectElement.children().eq(3);
                var fisIdentifierInput = projectElement.children().eq(3).find('input');
                
                updateGrantInputs(projectElement, projectNameInput, projectAcronymInput, fisIdentifier, fisIdentifierInput);                                        
            }
        });
    });
}

function updateGrantInputs(projectElement, projectNameInput, projectAcronymInput, fisIdentifier, fisIdentifierInput) {

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
         
                    var fundingDetails = getFundingDetails(grantNumberParentSelector);
                    if (fundingDetails.length > 0) {
                        // var fundingAgency = fundingDetails[0].fundingAgency;
                        // var projectGrantAcronymInput = fundingDetails[0].projectGrantAcronym;
                        
                        if (item.funding_orgs && item.funding_orgs.length > 1) {
                            updateFundingOrgs(0, item);
                        } else if (item.funding_orgs) {
                            emptyFundingElementFound = false;
                            var newFundingDetails = getFundingDetails(grantNumberParentSelector);

                            if (newFundingDetails.length > 0) {
                                var newFundingAgency = newFundingDetails[0].fundingAgency;
                                var newProjectGrantAcronymInput = newFundingDetails[0].projectGrantAcronym;
  
                                if ($(newFundingAgency).val() === "" && $(newProjectGrantAcronymInput).val() === "") {
                                    emptyFundingElementFound = true;

                                    if (item.funding_orgs[0] && item.acronym){
                                        $(newFundingAgency).val(item.funding_orgs[0].cfacro);
                                        $(newProjectGrantAcronymInput).val(item.acronym);
                                    }
                                }
                            }

                            // If no empty funding element was found, add a new one by clicking '+'
                            if (emptyFundingElementFound == false) {
                                emptyFundingElementFound = true;

                                // Prevent multiple executions
                                if (item.processed) {
                                    var newParentElement = $(grantNumberParentSelector).parent();
                                    var newFieldValuesElement = newParentElement.siblings('.dataset-field-values');
                                    var newCompoundFundingElement = newFieldValuesElement.find('.edit-compound-field');

                                    newCompoundFundingElement.last().next('.field-add-delete').children().eq(0).click();
                                }
                                item.processed = true;
                                
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
                                        funding_orgs: element.funding_org
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
                $(projectAcronymInput).val('');
                $(fisIdentifierInput).val('')
                            
                var clearFundingDetails = getFundingDetails(grantNumberParentSelector);
                
                if (clearFundingDetails.length > 0) {
                    
                    function clearFundingOrgs(i) {
                        if (i >= clearFundingDetails.length) return;
                        index = 0;
                        var clearFundingAgency = clearFundingDetails[i].fundingAgency;
                        var clearProjectGrantAcronymInput = clearFundingDetails[i].projectGrantAcronym;
                        
                        if ($(clearProjectGrantAcronymInput).val() === oldProjectGrantAcronymInput) {
                            $(clearFundingAgency).val('');
                            $(clearProjectGrantAcronymInput).val('');

                            setTimeout(function() {
                                var clearFundingElement = clearFundingDetails[(i-index)].deleteFundingElement
                                clearFundingElement.click();
                                index = index+1;
                            }, 500);
                        }
                        clearFundingOrgs(i + 1);
                    }
                    clearFundingOrgs(0);
                }
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

// Helper function to mimic setTimeout using Promise
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Recursive function to handle async DOM update after each click
async function updateFundingOrgs(i, item) {
    if (i >= item.funding_orgs.length) return;  // Exit condition

    // This can not be replaced with the function getFundingDetails as the position of siblings child depends on 'i'
    $(grantNumberParentSelector).each(async function() {
        var newParentElement = $(this).parent();
        var newFieldValuesElement = newParentElement.siblings('.dataset-field-values');
        var newFundingElement = newFieldValuesElement.find('.edit-compound-field').last();
        var newFundingAgency = newFundingElement.children().eq(0).find('input');
        var newProjectGrantAcronymInput = newFundingElement.children().eq(1).find('input');

        console.log("i:", i);
        console.log("Item processed", item.processed);
        
        if (!item.processed && i === 0) {
            if ($(newFundingAgency).val() !== "" || $(newProjectGrantAcronymInput).val() !== "") {
                newFundingElement.next('.field-add-delete').children().eq(0).click();

                // Use await delay instead of setTimeout
                await delay(1000);

                $(grantNumberParentSelector).each(function() {
                    var updatedParentElement = $(this).parent();
                    var updatedFieldValuesElement = updatedParentElement.siblings('.dataset-field-values');
                    var updatedFundingElement = updatedFieldValuesElement.find('.edit-compound-field').last();
                    var updatedFundingAgency = updatedFundingElement.children().eq(0).find('input');
                    var updatedProjectGrantAcronymInput = updatedFundingElement.children().eq(1).find('input');

                    console.log(updatedParentElement);
                    console.log(updatedFieldValuesElement);
                    console.log(updatedFundingElement);
                    console.log("Funding Agency", updatedFundingAgency);
                    console.log("Project Acronym", updatedProjectGrantAcronymInput);

                    $(updatedFundingAgency).val(item.funding_orgs[i].cfacro);
                    $(updatedProjectGrantAcronymInput).val(item.acronym);
                });
            } else {
                // If both fields are empty, fill them in first
                $(newFundingAgency).val(item.funding_orgs[i].cfacro);
                $(newProjectGrantAcronymInput).val(item.acronym);
            }
        } else if(item.processed){
            $(newFundingAgency).val(item.funding_orgs[i].cfacro);
            $(newProjectGrantAcronymInput).val(item.acronym);
        }

        if (item.processed && i < item.funding_orgs.length - 1) {
            newFundingElement.next('.field-add-delete').children().eq(0).click();

            // Await the delay before calling the next update
            await delay(500);

            // Recursively call updateFundingOrgs with the next index
            await updateFundingOrgs(i + 1, item);
        }
    });
    item.processed = true;
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