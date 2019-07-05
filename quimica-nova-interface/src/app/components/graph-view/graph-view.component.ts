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
        // Construindo o formulário reativo
        this.filterForm = this.formBuilder.group({
            keyword: [''],
            period: ['0'],
            visualizationType: ['community'],
            neighborsNumber: ['2', { disabled: true }]
        });

        // Queries iniciais
        this.communityAlg = 'CALL algo.louvain.stream(\'MATCH (k:Keyword) RETURN id(k) as id\', \'MATCH (k0)-[r]-(k1) RETURN id(k0) as source, id(k1) as target\', {graph: \'cypher\', write:true}) YIELD nodeId MATCH path = (k0)-[r]-(k1) RETURN * LIMIT 1000';
        this.query = 'MATCH path = (k0)-[r]-(k1) RETURN * LIMIT 1000';

        // Controla o seletor de modo de visualização (comunidade ou vizinhos)
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

        // Aguarda por mudanças no formulário
        this.filterForm.valueChanges
            .pipe(
                debounceTime(500),
                tap(() => {
                    // Cria um modelo de filtros
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
                            last = 2018;
                            break;
                    }

                    // Constroi o comando para execução do algoritmo de comunidade (Louvain) para um determinado período
                    this.communityAlg = 'CALL algo.louvain(\'MATCH (k:Keyword) RETURN id(k) as id\', \'MATCH (k0)-[r]-(k1) ';
                    
                    if (first && last) {
                        this.communityAlg += `WHERE ${first} <= r.year_src <= ${last} AND ${first} <= r.year_dst <= ${last} `
                    }

                    this.communityAlg += 'RETURN id(k0) as source, id(k1) as target\', {graph: \'cypher\', write:true})';

                    // Constroi a query para os filtros especificados
                    this.query = 'MATCH ';

                    // Filtra os resultados de acordo com o que foi preenchido
                    if (filters.communityVisualization) {
                        // this.query += `(k { keyword: '${filters.keyword}' }), `
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
                    
                    this.query += 'RETURN k0, k1, r';

                    if (!first && !last && filters.keyword === '') {
                        this.query += ' LIMIT 1000';
                    }

                    console.log(this.communityAlg);
                    console.log(this.query);
                })
            ).subscribe();
    }
}
