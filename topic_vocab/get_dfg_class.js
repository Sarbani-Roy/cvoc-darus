var topicParentSelector = "div#metadata_topicClassification";
var topicSelector = "span[data-cvoc-protocol='dfgTopicClass']";
var topicInputSelector = "input[data-cvoc-protocol='dfgTopicClass']";

$(document).ready(function() {
    expandPeople();
});

function expandPeople() {
    $(topicParentSelector).each(function() {
        console.log(topicParentSelector)
        // var parentElement = $(topicParentSelector).parent();
        // var fieldValuesElement = parentElement.siblings('.dataset-field-values');
        // var compoundFieldElement = fieldValuesElement.find('.edit-compound-field');
            
        // compoundFieldElement.each(function() {
        //     var topicElement = $(this);
        //     console.log(topicElement)
        //     if (topicElement.children().length > 2) {
        //         var topicClass = topicElement.children().eq(0).find('input');
        //         var topicClassVocab = topicElement.children().eq(1).find('input');
        //         var topicClassVocabURI = topicElement.children().eq(3).find('input');

        //         updatePeopleInputs(topicElement, topicClass, topicClassVocab, topicClassVocabURI);
        //     }
        // });
    });
}
