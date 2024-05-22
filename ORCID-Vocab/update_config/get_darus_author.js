var authorSelector = "div#metadata_author";
var personSelector = "span[data-cvoc-protocol='orcid']";
var personInputSelector = "input[data-cvoc-protocol='orcid']";

$(document).ready(function() {
    console.log("Document is ready.");
    expandPeople();
    updatePeopleInputs();
});

function expandPeople() {
    console.log("expandPeople function called.");
    
    $(authorSelector).each(function() {
        var authorElement = this;
        var numChildren = authorElement.children.length;
        console.log("Number of children in authorElement: ", numChildren);

        var siblingElement = $(this);
        console.log("Sibling element tag name: ", siblingElement.prop("tagName"));
        
        siblingElement.children().each(function() {
            var childElement = $(this);
            console.log("Child element tag name: ", childElement.prop("tagName"));
        });
        
        // // 2nd child contains the input field for author affiliation
        // let authorAffiliation = authorElement.children[1].querySelector('input');
        // // 3rd child is the identifier scheme wrapper and contains multiple elements:
        // // - a label element that shows the current selected value
        // let authorIdentifierSchemeText = authorElement.children[2].querySelector('.ui-selectonemenu-label');
        // // - a select element that contains the drop-down
        // let authorIdentifierSchemeSelect = authorElement.children[2].querySelector('select');
        // // 4th child contains the input element for the identifier
        // let authorIdentifier = authorElement.children[3].querySelector('input');

        $(authorElement).find(personSelector).each(function() {
            var personElement = this;
            console.log("Person Element found: ", personElement);
            if (!$(personElement).hasClass('expanded')) {
                $(personElement).addClass('expanded');
                var id = personElement.textContent;
                if (id.startsWith("https://orcid.org/")) {
                    id = id.substring(18);
                }
                $.ajax({
                    type: "GET",
                    url: "https://pub.orcid.org/v3.0/" + id + "/person",
                    dataType: 'json',
                    headers: {
                        'Accept': 'application/json'
                    },
                    success: function(person, status) {
                        var name = person.name['family-name'].value + ", " + person.name['given-names'].value;
                        var html = "<a href='https://orcid.org/" + id + "' target='_blank' rel='noopener' >" + name + "</a>";
                        personElement.innerHTML = html;

                        // // Fill author affiliation
                        // if (person['activities-summary'] && person['activities-summary']['employments'] && person['activities-summary']['employments']['employment-summary']) {
                        //     var employment = person['activities-summary']['employments']['employment-summary'][0];
                        //     authorAffiliation.value = employment['organization']['name'];
                        // }

                        // // Fill author identifier scheme and identifier
                        // authorIdentifierSchemeSelect.value = "ORCID"; // Assuming ORCID is the scheme
                        // authorIdentifierSchemeText.innerHTML = "ORCID";
                        // authorIdentifier.value = id;

                        if (person.emails.email.length > 0) {
                            $(personElement).popover({
                                content: person.emails.email[0].email,
                                placement: 'top',
                                template: '<div class="popover" role="tooltip" style="max-width:600px;word-break:break-all"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
                            });
                            personElement.onmouseenter = function() {
                                $(this).popover('show');
                            };
                            personElement.onmouseleave = function() {
                                $(this).popover('hide');
                            };
                        }
                        if (localStorage.length > 100) {
                            localStorage.removeItem(localStorage.key(0));
                        }
                        localStorage.setItem(id, name);
                    },
                    failure: function(jqXHR, textStatus, errorThrown) {
                        if (jqXHR.status != 404) {
                            console.error("The following error occurred: " + textStatus, errorThrown);
                        }
                    }
                });
            }
        });
    });
}

function updatePeopleInputs() {
    console.log("updatePeopleInputs function called.");

    $(authorSelector).each(function() {
        var authorElement = this;
        // // Get all div children of authorElement
        // var divChildren = $(authorElement).find('div');
        // console.log("Div children of Author Element:", divChildren);

        // // 2nd child contains the input field for author affiliation
        // let authorAffiliation = authorElement.children[1].querySelector('input');
        // // 3rd child is the identifier scheme wrapper and contains multiple elements:
        // // - a label element that shows the current selected value
        // let authorIdentifierSchemeText = authorElement.children[2].querySelector('.ui-selectonemenu-label');
        // // - a select element that contains the drop-down
        // let authorIdentifierSchemeSelect = authorElement.children[2].querySelector('select');
        // // 4th child contains the input element for the identifier
        // let authorIdentifier = authorElement.children[3].querySelector('input');

        
        $(authorElement).find(personInputSelector).each(function() {
            var personInput = this;
            console.log("Person Input Element found: ", personInput);
            
            if (!personInput.hasAttribute('data-person')) {
                let num = Math.floor(Math.random() * 100000000000);
                $(personInput).hide();
                $(personInput).attr('data-person', num);
                var selectId = "personAddSelect_" + num;
                $(personInput).after('<select id=' + selectId + ' class="form-control add-resource select2" tabindex="-1" aria-hidden="true">');
                $("#" + selectId).select2({
                    theme: "classic",
                    tags: $(personInput).attr('data-cvoc-allowfreetext'),
                    delay: 500,
                    templateResult: function(item) {
                        if (item.loading) {
                            return item.text;
                        }
                        var $result = markMatch(item.text, term);
                        return $result;
                    },
                    templateSelection: function(item) {
                        var pos = item.text.search(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/);
                        if (pos >= 0) {
                            var orcid = item.text.substr(pos, 19);
                            return $('<span></span>').append(item.text.replace(orcid, "<a href='https://orcid.org/" + orcid + "'>" + orcid + "</a>"));
                        }
                        return item.text;
                    },
                    language: {
                        searching: function(params) {
                            return 'Search by name, email, or ORCID…';
                        }
                    },
                    placeholder: personInput.hasAttribute("data-cvoc-placeholder") ? $(personInput).attr('data-cvoc-placeholder') : "Select a Person",
                    minimumInputLength: 3,
                    allowClear: true,
                    ajax: {
                        url: function(params) {
                            var term = params.term;
                            if (!term) {
                                term = "";
                            }
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
                                    .sort((a, b) => (localStorage.getItem(b['orcid-id'])) ? 1 : 0)
                                    .map(function(x) {
                                        console.log(x);
                                        return {
                                            text: x['given-names'] + " " + x['family-names'] +
                                                ", " +
                                                x['orcid-id'] +
                                                ((x.email.length > 0) ? ", " + x.email[0] : "") +
                                                ((x['institution-name'].length > 0) ? ", " + x['institution-name'].pop() : ""),
                                            id: x['orcid-id'],
                                            title: 'Open in new tab to view ORCID page'
                                        };
                                    })
                            };
                        }
                    }
                });
                var id = $(personInput).val();
                if (id.startsWith("https://orcid.org")) {
                    id = id.substring(18);
                    $.ajax({
                        type: "GET",
                        url: "https://pub.orcid.org/v3.0/" + id + "/person",
                        dataType: 'json',
                        headers: {
                            'Accept': 'application/json'
                        },
                        success: function(person, status) {
                            console.log(person);
                            var name = person.name['given-names'].value + " " + person.name['family-name'].value;
                            var text = name + ", " + id;
                            if (person.emails.email.length > 0) {
                                text = text + ", " + person.emails.email[0].email;
                            }
                            var newOption = new Option(text, id, true, true);
                            newOption.title = 'Open in new tab to view ORCID page';
                            $('#' + selectId).append(newOption).trigger('change');

                            // // Fill author affiliation
                            // if (person['activities-summary'] && person['activities-summary']['employments'] && person['activities-summary']['employments']['employment-summary']) {
                            //     var employment = person['activities-summary']['employments']['employment-summary'][0];
                            //     authorAffiliation.value = employment['organization']['name'];
                            // }

                            // // Fill author identifier scheme and identifier
                            // authorIdentifierSchemeSelect.value = "ORCID"; // Assuming ORCID is the scheme
                            // authorIdentifierSchemeText.innerHTML = "ORCID";
                            // authorIdentifier.value = id;
                        },
                        failure: function(jqXHR, textStatus, errorThrown) {
                            if (jqXHR.status != 404) {
                                console.error("The following error occurred: " + textStatus, errorThrown);
                            }
                        }
                    });
                } else {
                    var newOption = new Option(id, id, true, true);
                    $('#' + selectId).append(newOption).trigger('change');
                }
                $('#' + selectId).on('select2:select', function(e) {
                    var data = e.params.data;
                    if (data.id != data.text) {
                        $("input[data-person='" + num + "']").val("https://orcid.org/" + data.id);
                    } else {
                        $("input[data-person='" + num + "']").val(data.id);
                    }
                });
                $('#' + selectId).on('select2:clear', function(e) {
                    $("input[data-person='" + num + "']").attr('value', '');
                });
            }
        });
    });
}

function markMatch(text, term) {
    var match = text.toUpperCase().indexOf(term.toUpperCase());
    var $result = $('<span></span>');
    if (match < 0) {
        return $result.text(text);
    }
    $result.text(text.substring(0, match));
    var $match = $('<span class="select2-rendered__match"></span>');
    $match.text(text.substring(match, match + term.length));
    $result.append($match);
    $result.append(text.substring(match + term.length));
    return $result;
}
