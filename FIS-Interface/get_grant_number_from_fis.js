var grantNumberParentSelector = "div#metadata_grantNumber";
var projectParentSelector = "div#metadata_project";
var projectSelector = "span[data-cvoc-protocol='fis']";
var projectInputSelector = "input[data-cvoc-protocol='fis']";

$(document).ready(function() {
    expandProject();
});

function expandProject() {
    $(projectParentSelector).each(function() {
        var parentElement = $(projectParentSelector).parent();
        var fieldValuesElement = parentElement.siblings('.dataset-field-values');
        var compoundFieldElement = fieldValuesElement.find('.edit-compound-field'); // Select all children with class 'edit-compound-field'
            
        compoundFieldElement.each(function() {
            var projectElement = $(this);
            // console.log("Project Element:", projectElement);
            if (projectElement.children().length > 1) {
                var projectNameInput = projectElement.children().eq(0).find('input');
                // console.log("Project Name:", projectNameInput);
                
                updateGrantInputs(projectElement, projectNameInput);
            }
        });
    });
}

function updateGrantInputs(projectElement, projectNameInput) {

    //console.log("Project Element:", projectElement);
    //console.log("Project Name:", projectNameInput);
    $(projectElement).find(projectInputSelector).each(function() {
        // console.log(grantNumberParentSelector);
        var parentElement = $(grantNumberParentSelector).parent();
        
        var fieldValuesElement = parentElement.siblings('.dataset-field-values');
        var compoundFieldElement = fieldValuesElement.find('.edit-compound-field');
        // console.log(compoundFieldElement);
        if (compoundFieldElement.children().length > 1) {
            var grantAgency = compoundFieldElement.children().eq(0).find('input');
            var grantId = compoundFieldElement.children().eq(1).find('input');
        }

        var projectInput = this;
        // console.log(projectInput.getAttribute())
        if (!projectInput.hasAttribute('data-project')) {
            // Random identifier added
            let num = Math.floor(Math.random() * 100000000000);
            $(projectInput).hide();
            $(projectInput).attr('data-project', num);
            
        //     // Add a select2 element to allow search and provide a list of choices
            var selectId = "projectAddSelect_" + num;
            // console.log(selectId)
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
                    if ($(projectNameInput).val() === "" && item.name) {
                        var projectName = item.name;
                    }
                    else{
                        var projectName = $(projectNameInput).val();
                    }
                    // console.log(item);
                    $(grantAgency).val(item.agency);
                    $(grantId).val(item.id);
                    item.text = projectName;
                    //item.text = "hello"
                    return item.text;
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
                            term = "";
                        }
                        // Use expanded-search to get the names, affiliations directly in the results
                        return "https://fis-qs.campus.uni-stuttgart.de/openfis/api/extern/projects";
                    },
                    data: function(params) {
                        term = `title=${params.term}`;
                        // console.log("Title:", term);
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
                        // console.log(data);
                        return {
                            results: data['data_elements']
                                .map(function(element) {
                                    // Access the project information within each data element
                                    let projectInfo = element.project;
                                    // console.log('Project ID:', projectInfo.id);
                                    // console.log('Project Title (DE):', projectInfo.title_de);
                                    // console.log('Project Title (EN):', projectInfo.title_en);
                                    // console.log('Project Acronym:', projectInfo.acronym);
                                    // console.log('Project Foerderkennzeichen:', projectInfo.foerderkennzeichen);

                                    // Returning the desired structure
                                    return {
                                        text: projectInfo.title_de + " (" + projectInfo.acronym + ")",
                                        agency: projectInfo.foerderkennzeichen,
                                        id: projectInfo.id,
                                    };
                                })
                            }
                        }
                    }
            });

            // When a selection is made, set the value of the hidden input field
            $('#' + selectId).on('select2:select', function(e) {
                var data = e.params.data;
                //For free-texts, the id and text are same. Otherwise different
                if (data.id != data.text) {
                    var projectName = data.text.split(',')[0];
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

function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
