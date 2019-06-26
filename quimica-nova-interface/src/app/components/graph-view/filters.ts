export class FiltersModel {
    keyword: string;
    period: string;
    communityVisualization: boolean;
    neighborsVisualization: boolean;
    neighborsNumber: string;

    constructor(keyword: string, period: string, communityVisualization: boolean, neighborsVisualization: boolean, neighborsNumber: string) {
        this.keyword = keyword;
        this.period = period;
        this.communityVisualization = communityVisualization;
        this.neighborsVisualization = neighborsVisualization;
        this.neighborsNumber = neighborsNumber;
    }
}