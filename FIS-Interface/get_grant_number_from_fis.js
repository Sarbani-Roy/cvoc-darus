var grantNumberParentSelector = "div#metadata_grantNumber";
var projectParentSelector = "div#metadata_project";
var projectSelector = "span[data-cvoc-protocol='fis']";
var projectInputSelector = "input[data-cvoc-protocol='fis']";

$(document).ready(function() {
    expandProject();
});

function expandProject() {
    $(grantNumberParentSelector).each(function() {
        var parentElement = $(grantNumberParentSelector).parent();
        var fieldValuesElement = parentElement.siblings('.dataset-field-values');
        var compoundFieldElement = fieldValuesElement.find('.edit-compound-field'); 

        compoundFieldElement.each(function() {
            var grantNumberElement = $(this);
            
            // Get the corresponding project element
            var projectElement = $(projectSelector).closest(projectParentSelector).siblings('.dataset-field-values').find('.edit-compound-field');
            
            // Iterate over the children and pair them
            grantNumberElement.children().each(function(index) {
                var grantChild = $(this).find('input');
                var projectChild = projectElement.children().eq(index).find('input');

                if (grantChild.length > 0 && projectChild.length > 0) {
                    var grantAgency = grantNumberElement.children().eq(0).find('input');
                    var grantIdentifier = grantNumberElement.children().eq(1).find('input');

                    projectElement.find(projectInputSelector).each(function() {
                        var projectNameInput = this;
                    })

                    // updategrantInputs(grantNumberElement, grantChild, projectChild);
                    updategrantInputs(grantNumberElement, projectNameInput, grantAgency, grantIdentifier);
                }
            });
        });
    });
}

// function updategrantInputs(grantNumberElement, grantInput, projectInput) {

//     console.log("Grant Input:", grantInput.val());
//     console.log("Project Input:", projectInput.val());
// }


function updategrantInputs(grantNumberElement, projectNameInput, grantAgency, grantIdentifier) {

    console.log("Grant Agency:", grantAgency.val());
    console.log("Grant Identifier:", grantIdentifier.val());
    console.log("Project Name:", projectNameInput.val());
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