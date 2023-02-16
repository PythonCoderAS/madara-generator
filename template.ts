export function SourceTemplate(name: string, base_url: string, icon_name: string, author: string, github_username: string) {
    return `import {LanguageCode, SourceInfo, TagType} from "paperback-extensions-common";
import {Madara} from '../Madara'

const ${name.toUpperCase()}_DOMAIN = "${base_url}"

export const ${name}Info: SourceInfo = {
    version: '1.0.0',
    name: '${name}',
    description: 'Extension that pulls manga from ${name}',
    author: '${author}',
    authorWebsite: 'https://github.com/${github_username}',
    icon: "${icon_name}",
    hentaiSource: false,
    websiteBaseURL: ${name.toUpperCase()}_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: TagType.GREEN
        }
    ]
}

export class ${name} extends Madara {
    baseUrl: string = ${name.toUpperCase()}_DOMAIN
    languageCode: LanguageCode = LanguageCode.ENGLISH
}
`
}

export function TestFileTemplate(name: string, mangaId: string, searchTerm: string){
    return `import cheerio from 'cheerio'
import { MadaraAPIWrapper } from '../MadaraAPIWrapper'
import { Madara } from '../Madara'
import { ${name} } from '../${name}/${name}'

describe('${name} Tests', function () {


    var wrapper: MadaraAPIWrapper = new MadaraAPIWrapper();
    var source: Madara = new ${name}(cheerio);
    var chai = require('chai'), expect = chai.expect, should = chai.should();
    var chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);

    /**
     * The Manga ID which this unit test uses to Madara it's details off of.
     * Try to choose a manga which is updated frequently, so that the historical checking test can
     * return proper results, as it is limited to searching 30 days back due to extremely long processing times otherwise.
     */
    var mangaId = "${mangaId}";
    var mangaNumericId = ''

    // Grab the ID automatically
    before(async () =>
    {
        if(mangaNumericId === '') {
            try{
                mangaNumericId = await wrapper.getMadaraNumericId(source, mangaId)
            }
            catch {
                console.log(\`Could not automatically retrieve the numeric id for "\$\{mangaId\}". Try entering it manually.\`)
            }
        }
    })

    it("Retrieve Manga Details", async () => {
        let details = await wrapper.getMangaDetails(source, mangaId);
        expect(details, "No results found with test-defined ID [" + mangaId + "]").to.exist;

        // Validate that the fields are filled
        let data = details;
        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.image, "Missing Image").to.be.not.empty;
        expect(data.status, "Missing Status").to.exist;
        expect(data.author, "Missing Author").to.be.not.empty;
        expect(data.desc, "Missing Description").to.be.not.empty;
        expect(data.titles, "Missing Titles").to.be.not.empty;
        expect(data.rating, "Missing Rating").to.exist;
    });

    it("Get Chapters", async () => {
        let data = await wrapper.getChapters(source, mangaNumericId);
        expect(data, "No chapters present for: [" + mangaId + "]").to.not.be.empty;

        let entry = data[0]
        expect(entry.id, "No ID present").to.not.be.empty;
        expect(entry.time, "No date present").to.exist
        // expect(entry.name, "No title available").to.not.be.empty
        expect(entry.chapNum, "No chapter number present").to.exist
    });

    it("Get Chapter Details", async () => {
        let chapters = await wrapper.getChapters(source, mangaNumericId);
        let data = await wrapper.getChapterDetails(source, mangaId, chapters[0].id);

        expect(data, "No server response").to.exist;
        expect(data, "Empty server response").to.not.be.empty;

        expect(data.id, "Missing ID").to.be.not.empty;
        expect(data.mangaId, "Missing MangaID").to.be.not.empty;
        expect(data.pages, "No pages present").to.be.not.empty;
    });

    it("Testing search", async () => {
        let testSearch = createSearchRequest({
            title: '${searchTerm}'
        });

        let search = await wrapper.searchRequest(source, testSearch, {page: 0});
        let result = search.results[0];

        expect(result, "No response from server").to.exist;

        expect(result.id, "No ID found for search query").to.be.not.empty;
        expect(result.image, "No image found for search").to.be.not.empty;
        expect(result.title, "No title").to.be.not.null;
        expect(result.subtitleText, "No subtitle text").to.be.not.null;
    });

    it("Testing Home-Page aquisition", async() => {
        let homePages = await wrapper.getHomePageSections(source)
        expect(homePages, "No response from server").to.exist
    })


    it("Testing home page results for latest titles", async() => {
        let results = await wrapper.getViewMoreItems(source, "0", {}, 3)

        expect(results, "No results whatsoever for this section").to.exist
        expect(results, "No results whatsoever for this section").to.exist

        let data = results![0]
        expect(data.id, "No ID present").to.exist
        expect(data.image, "No image present").to.exist
        expect(data.title.text, "No title present").to.exist
    })

    it("Testing Notifications", async () => {
        let updates = await wrapper.filterUpdatedManga(source, new Date("2021-02-01"), [mangaId])
        expect(updates, "No server response").to.exist
        expect(updates, "Empty server response").to.not.be.empty
        expect(updates[0], "No updates").to.not.be.empty;
    })

    it("Testing get tags", async () => {
        let updates = await wrapper.getTags(source)
        expect(updates, "No server response").to.exist
        expect(updates, "Empty server response").to.not.be.empty
    })

})`
}