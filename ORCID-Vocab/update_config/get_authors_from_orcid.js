var authorParentSelector = "div#metadata_author";
var personSelector = "span[data-cvoc-protocol='orcid']";
var personInputSelector = "input[data-cvoc-protocol='orcid']";

$(document).ready(function() {
    expandPeople();
    //updatePeopleInputs();
});

function expandPeople() {
    $(authorParentSelector).each(function() {
        var parentElement = $(authorParentSelector).parent();
        var fieldValuesElement = parentElement.siblings('.dataset-field-values');
        var compoundFieldElement = fieldValuesElement.find('.edit-compound-field'); // Select all children with class 'edit-compound-field'
            
        compoundFieldElement.each(function() {
            var authorElement = $(this);
            if (authorElement.children().length > 3) {
                var authorAffiliation = authorElement.children().eq(1).find('input');
                var authorIdentifierSchemeText = authorElement.children().eq(2).find('.ui-selectonemenu-label');
                var authorIdentifierSchemeSelect = authorElement.children().eq(2).find('select').get(0);
                var authorIdentifier = authorElement.children().eq(3).find('input');

                updatePeopleInputs(authorElement, authorIdentifier, authorIdentifierSchemeSelect, authorIdentifierSchemeText, authorAffiliation);
            }
        });
    });
}

function updatePeopleInputs(authorElement, authorIdentifier, authorIdentifierSchemeSelect, authorIdentifierSchemeText, authorAffiliation) {
    $(authorElement).find(personInputSelector).each(function() {
        var personInput = this;
        if (!personInput.hasAttribute('data-person')) {
            cconsole.log("Does no have a dataperson attribute")
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
                    if (item.text.includes(',')){
                        var authorName = item.text.split(',')[0];
                        item.text = authorName
                    }
                    return item.text;
                },
                language: {
                    searching: function(params) {
                        return 'Search by name, email, or ORCID…';
                    }
                },
                placeholder: personInput.hasAttribute("data-cvoc-placeholder") ? $(personInput).attr('data-cvoc-placeholder') : "Select an Author",
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
                                    // Institution names by using the last one
                                    let institutionNames = x['institution-name'];
                                    let lastInstitution = Array.isArray(institutionNames) ? institutionNames[institutionNames.length - 1] : "";
                                    return {
                                        text: x['given-names'] + " " + x['family-names'] +
                                            ", " +
                                            x['orcid-id'] +
                                            ((x.email.length > 0) ? ", " + x.email[0] : "") +
                                            (lastInstitution ? ", " + lastInstitution : ""),
                                        id: x['orcid-id'],
                                        title: 'Open in new tab to view ORCID page',
                                        affiliation: lastInstitution
                                    };
                                })
                        };
                    }
                }
            });
            var id = $(authorIdentifier).val()
            if (id.startsWith("https://orcid.org")) {
                id = id.substring(18);
            }
            if (id) {
                $.ajax({
                    type: "GET",
                    url: "https://pub.orcid.org/v3.0/" + id + "/person",
                    dataType: 'json',
                    headers: {
                        'Accept': 'application/json'
                    },
                    success: function(person, status) {
                        var name = person.name['given-names'].value + " " + person.name['family-name'].value;
                        // $(authorName).val(name);
                        var text = name + ", " + id;
                        if (person.emails.email.length > 0) {
                            text = text + ", " + person.emails.email[0].email;
                        }
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
            $('#' + selectId).on('select2:select', function(e) {
                var data = e.params.data;
                console.log("TEXT:", data.text)
                console.log("id:", data.id)
                console.log("DATA", data)
                console.log("data-person:", data-person)
                if (data.id != data.text) {
                    $("input[data-person='" + num + "']").val(data.text.split(',')[0]);;
                } else {
                    //Tags are allowed, so just enter the text as is
                    $("input[data-person='" + num + "']").val(data.text);
                }
            });
            $('#' + selectId).on('select2:clear', function(e) {
                $("input[data-person='" + num + "']").attr('value', '');
            });
        }
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

// inside expand people
// console.log("Author element: ", authorElement)
        
        // $(authorElement).find(personInputSelector).each(function() {
        //     var personElement = this;
        //     console.log(personElement)
        //     if (!$(personElement).hasClass('expanded')) {
        //         console.log("Does not have expanded class")
        //     // }
        //     // if ($(personElement).attr('aria-expanded') === 'false') {
        //     //     // Set aria-expanded to true
        //     //     $(personElement).attr('aria-expanded', 'true');
        //         $(personElement).addClass('expanded');
                
        //         // Retrieve the id
        //         var id = $(authorIdentifier).val();
        //         if (id.startsWith("https://orcid.org/")) {
        //             id = id.substring(18);
        //         }
        //         console.log(id);
        //         $.ajax({
        //             type: "GET",
        //             url: "https://pub.orcid.org/v3.0/expanded-search" + id + "/person",
        //             dataType: 'json',
        //             headers: {
        //                 'Accept': 'application/json'
        //             },
        //             success: function(person, status) {
        //                 var name = person.name['family-name'].value + ", " + person.name['given-names'].value;
        //                 console.log(name)
        //                 var html = "<a href='https://orcid.org/" + id + "' target='_blank' rel='noopener' >" + name + "</a>";
        //                 personElement.innerHTML = html;

        //                 if (person.emails.email.length > 0) {
        //                     $(personElement).popover({
        //                         content: person.emails.email[0].email,
        //                         placement: 'top',
        //                         template: '<div class="popover" role="tooltip" style="max-width:600px;word-break:break-all"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
        //                     });
        //                     personElement.onmouseenter = function() {
        //                         $(this).popover('show');
        //                     };
        //                     personElement.onmouseleave = function() {
        //                         $(this).popover('hide');
        //                     };
        //                 }
        //                 if (localStorage.length > 100) {
        //                     localStorage.removeItem(localStorage.key(0));
        //                 }
        //                 localStorage.setItem(id, name);
        //             },
        //             failure: function(jqXHR, textStatus, errorThrown) {
        //                 if (jqXHR.status != 404) {
        //                     console.error("The following error occurred: " + textStatus, errorThrown);
        //                 }
        //             }
        //         });
        //     }
        // });
