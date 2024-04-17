
$(document).ready(function() {
    expandPeople();
    })
    
function expandPeople() {
    
    var suggestionBox;
    $(document).on('input', '.author-group', function() {
        var authorNameValue = $(this).find('#authorName').val();
        var authorNameField = $(this).find('#authorName');
        var authorAffiliationField = $(this).find('#authorAffiliation');
        var authorIdentifierField = $(this).find('#authorIdentifier');
        var authorIdentifierTypeField = $(this).find('#authorIdentifierType');
        suggestionBox = $(this).find('#suggestionBox');
        console.log(authorNameValue);
        if (authorNameValue.length > 3) {
        searchForOrcidId(authorNameValue, suggestionBox, authorNameField, authorAffiliationField, authorIdentifierField, authorIdentifierTypeField);
        } else {
        suggestionBox.empty().hide();
        }
    }).on('keydown', function(e) {
        //var suggestionBox = $(this).find('#suggestionBox');
        var suggestions = suggestionBox.find('.suggestion');
        var selectedSuggestion = suggestionBox.find('.selected-suggestion');
        var currentIndex = suggestions.index(selectedSuggestion);

        switch(e.which) {
        case 38: // Up arrow
            e.preventDefault();
            scrollSuggestions(suggestionBox, 'up');
            break;
        case 40: // Down arrow
            e.preventDefault();
            scrollSuggestions(suggestionBox, 'down');
            break;
        case 13: // Enter key
            e.preventDefault();
            if (selectedSuggestion.length > 0) {
            selectedSuggestion.click();
            }
            break;
        }
    });
}

function scrollSuggestions(suggestionBox, direction) {
    const suggestionList = suggestionBox;
    const suggestions = suggestionList.find('.suggestion');
    var selectedSuggestion = suggestionList.find('.selected-suggestion');
    var currentIndex = suggestions.index(selectedSuggestion);

    if (direction === 'up') {
        currentIndex = Math.max(0, currentIndex - 1);
    } else if (direction === 'down') {
        currentIndex = Math.min(suggestions.length - 1, currentIndex + 1);
    }

    suggestions.removeClass('selected-suggestion');
    selectedSuggestion = suggestions.eq(currentIndex);
    selectedSuggestion.addClass('selected-suggestion');
    selectedSuggestion[0].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
    });
}


function searchForOrcidId(authorNameValue, suggestionBox, authorNameField, authorAffiliationField, authorIdentifierField, authorIdentifierTypeField) {
    var apiUrl = "https://pub.orcid.org/v3.0/expanded-search/?q=" + encodeURIComponent(authorNameValue);
    $.ajax({
        url: apiUrl,
        headers: {
        "Accept": "application/vnd.orcid+json"
        },
        success: function(response) {
        var results = response["expanded-result"];
        if (results && results.length > 0) {
            // console.log(results.length);
            // $(authorAffiliationField).val(results.length); 
            suggestionBox.empty().show();
            for (var i = 0; i < results.length; i++) {
            var result = results[i];
            console.log(result)
            var suggestion = $("<div class='suggestion'>");
            var name = "";
            if (result["given-names"]) {
                name += result["given-names"];
            }
            if (result["family-names"]) {
                if (name.length > 0) {
                    name += " ";
                }
                name += result["family-names"];
            }
            if (name.length > 0) {
                suggestion.text(name);
            }
            if (result["orcid-id"]) {
                suggestion.append(" - " + result["orcid-id"]);
            }
            // if (result["institution-name"] && result["institution-name"].length > 0) {
            //   var institutionName = Array.isArray(result["institution-name"]) ? result["institution-name"][0] : result["institution-name"];
            //   suggestion.append(" - " + institutionName);
            // }
            var institutionNames = Array.isArray(result["institution-name"]) ? result["institution-name"] : [result["institution-name"]];
            var institutionName = institutionNames.pop(); // Get the last institution name
            if (institutionName && institutionName.length > 0) {
                suggestion.append(" - " + institutionName);
            }
            suggestion.click(function() {
                var clickedName = $(this).text().split(' - ')[0];
                var clickedOrcid = $(this).text().split(' - ')[1];
                var clickedInstitution = $(this).text().split(' - ')[2];
                $(authorNameField).val(clickedName);
                $(authorAffiliationField).val(clickedInstitution);
                $(authorIdentifierField).val(clickedOrcid);
                $(authorIdentifierTypeField).val("ORCID");
                suggestionBox.empty().hide();
            });
            suggestionBox.append(suggestion);
            }       
        } else {
            $suggestionBox.empty().hide();
        }
        },
        error: function(jqXHR, textStatus, errorThrown) {
        console.error("Error:", textStatus, errorThrown);
        }
    });
}

function addInput(containerId) {
    var container = document.getElementById(containerId);
    var originalGroup = container.querySelector(getgroup(containerId));
    var newGroup = originalGroup.cloneNode(true);

    // Reset values in the cloned input group and append the new input group to the container
    var authorLabel = newGroup.querySelector(getgroup(containerId) + ' .col label');
    authorLabel.textContent = ''; 
    var inputs = newGroup.querySelectorAll('input[type="text"]');
    inputs.forEach(function (input) {
        input.value = '';
    });

    // Create a new row wrapper and append the cloned group to it
    var newRow = document.createElement('div');
    newRow.classList.add('row');
    newRow.appendChild(newGroup);
    container.appendChild(newGroup);      
    }

    function removeInput(button) {
    var container = button.parentNode.parentNode.parentNode;
    container.parentNode.removeChild(container);
    }

    function getContainerClass(containerId) {
    switch (containerId) {
        case 'authorContainer':
        return 'author-container';
        default:
        return '';
    }
    }

    function getgroup(containerId) {
    switch (containerId) {
        case 'authorContainer':
        return '.author-group';
        default:
        return '';
    }
}
