# CVOC_for_DaRUS

## Configuration File
- [**Filename**: `cvocConf.json`](https://github.tik.uni-stuttgart.de/fokus/CVOC_for_DaRUS/blob/main/cvocConf.json)

## Script Location
- **Original Path in dev machine 2**: `/srv/www/dataverse_previewers/js/get_your_cvoc.js`
- One may need update the path in configuration file for `"js_url": "__dataverse_previewers__/js/get_your_cvoc.js"` 

## Steps to Update the Script

1. Upload the configuration file:
    ```sh
    curl -X PUT --upload-file cvocConf.json http://localhost:8080/api/admin/settings/:CVocConf 

2. Change directory to the script location:
    ```sh
    cd /srv/www/dataverse_previewers/js
    ```

3. Download the updated script(file in this repo has a token in the link):
    ```sh
    sudo wget https://raw.github.tik.uni-stuttgart.de/fokus/CVOC_for_DaRUS/main/ORCID-Vocab/get_authors_orcid.js?token=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    ```

4. Verify the changes at [demoDarus](https://nfldevdataverse2.rus.uni-stuttgart.de/)

### Re: 
- [Dataverse's CVOC repo](https://github.com/gdcc/dataverse-external-vocab-support)
