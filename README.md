# CVOC_for_DaRUS

## Configuration File
- [**Filename**: `cvoc-conf.json`](https://github.tik.uni-stuttgart.de/fokus/CVOC_for_DaRUS/blob/main/ORCID-Vocab/cvoc-conf.json)

## Script Location
- **Original Path in dev machine 2**: `/srv/www/dataverse_previewers/js/get_authors_from_orcid.js`
- One may need update the path in configuration file for `"js_url": "__dataverse_previewers__/js/get_authors_from_orcid.js"` 

## Steps to Update the Script

1. Change directory to the script location:
    ```sh
    cd /srv/www/dataverse_previewers/js
    ```

2. Download the updated script(file in this repo has a token in the link):
    ```sh
    sudo wget https://raw.githubusercontent.com/Sarbani-Roy/cvoc-darus/main/ORCID-Vocab/update_config/get_authors_orcid.js
    ```

3. Return to the previous home:
    ```sh
    cd --
    ```

4. Upload the configuration file:
    ```sh
    curl -X PUT --upload-file cvov-conf.json http://localhost:8080/api/admin/settings/:CVocConf
    ```

5. Verify the changes at [demoDarus](https://nfldevdataverse2.rus.uni-stuttgart.de/)

### Re: 
- [Dataverse's example](https://github.com/gdcc/dataverse-external-vocab-support)
