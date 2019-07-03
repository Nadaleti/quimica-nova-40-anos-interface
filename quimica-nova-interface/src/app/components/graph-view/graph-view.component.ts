import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { tap, debounceTime } from 'rxjs/operators';

import { FiltersModel } from './filters';

@Component({
    selector: 'graph-view',
    templateUrl: './graph-view.component.html',
    styleUrls: ['./graph-view.component.scss']
})
export class GraphViewComponent implements OnInit {
    public filterForm: FormGroup;
    public query: string;
    public communityAlg: string;

    get formControls() { return this.filterForm.controls };

    constructor(private formBuilder: FormBuilder) {}

    ngOnInit() {
        this.filterForm = this.formBuilder.group({
            keyword: [''],
            period: ['0'],
            visualizationType: ['community'],
            neighborsNumber: ['2', { disabled: true }]
        });

        this.communityAlg = 'CALL algo.louvain(\'MATCH (k:Keyword) RETURN id(k) as id\', \'MATCH (k0)-[r]-(k1) RETURN id(k0) as source, id(k1) as target\', {graph: \'cypher\', write:true})';
        this.query = 'MATCH path = (k0)-[r]-(k1) WHERE k1.community = k0.community RETURN *';

        // Fazer requisição geral logo que o componente for criado

        this.filterForm.controls['neighborsNumber'].disable();
        this.filterForm.controls['visualizationType'].valueChanges
            .subscribe(
                (value) => {
                    if (value === 'neighbors') {
                        this.filterForm.controls['neighborsNumber'].enable();
                    } else {
                        this.filterForm.controls['neighborsNumber'].disable();
                    }
                }
            );

        this.filterForm.valueChanges
            .pipe(
                debounceTime(500),
                tap(() => {
                    const communityVisualization = this.filterForm.controls['keyword'].value !== '' &&
                                                    this.formControls['visualizationType'].value == 'community' ? true : false;
                    const neighborsVisualization = this.filterForm.controls['keyword'].value !== '' &&
                                                    this.formControls['visualizationType'].value == 'neighbors' ? true : false;

                    let filters = new FiltersModel(
                        this.formControls['keyword'].value,
                        this.formControls['period'].value,
                        communityVisualization,
                        neighborsVisualization,
                        this.formControls['neighborsNumber'].value
                    );

                    // Constroi a query
                    let first, last;
                    switch(filters.period) {
                        case '1':
                            first = 1995;
                            last = 2000;
                            break;
                        case '2':
                            first = 2001;
                            last = 2005;
                            break;
                        case '3':
                            first = 2006;
                            last = 2010;
                            break;
                        case '4':
                            first = 2011;
                            last = 2015;
                            break;
                        case '5':
                            first = 2016;
                            last = 2017;
                            break;
                    }

                    // Realiza a execução do algoritmo de comunidade para um dado ano
                    this.communityAlg = 'CALL algo.louvain(\'MATCH (k:Keyword) RETURN id(k) as id\', \'MATCH (k0)-[r]-(k1) ';
                    
                    if (first && last) {
                        this.communityAlg += `WHERE ${first} <= r.year_src <= ${last} AND ${first} <= r.year_dst <= ${last} `
                    }

                    this.communityAlg += 'RETURN id(k0) as source, id(k1) as target\', {graph: \'cypher\', write:true})';

                    this.query = 'MATCH ';

                    // Filtra os resultados de acordo com o que foi preenchido
                    if (filters.communityVisualization) {
                        this.query += `(k { keyword: '${filters.keyword}' }), `
                    }

                    this.query += 'path = (k0';
                    
                    if (filters.keyword !== '') {
                        if (filters.communityVisualization) {
                            this.query += '{ community: k.community }'
                        } else {
                            this.query += ` { keyword: '${filters.keyword}' }`;
                        }
                    }

                    this.query += ')-[r';

                    if (filters.neighborsVisualization) {
                        this.query += `*0..${filters.neighborsNumber}`;
                    }

                    this.query += ']-(k1';
                    if (filters.communityVisualization) {
                        this.query += '{ community: k.community }'
                    }
                    this.query += ') ';

                    if (first && last) {
                        this.query += ` WHERE all(r in relationships(path) WHERE ${first} <= r.year_src <= ${last} AND ${first} <= r.year_dst <= ${last}) `;
                    }
                    
                    this.query += 'RETURN *';

                    console.log(this.communityAlg);
                    console.log(this.query);
                })
            ).subscribe();
    }
}
