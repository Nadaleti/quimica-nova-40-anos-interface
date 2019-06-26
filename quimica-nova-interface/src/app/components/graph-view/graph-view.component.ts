import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, tap } from 'rxjs/operators';

import { FiltersModel } from './filters';

@Component({
    selector: 'graph-view',
    templateUrl: './graph-view.component.html',
    styleUrls: ['./graph-view.component.scss']
})
export class GraphViewComponent implements OnInit {
    public filterForm: FormGroup;

    get formControls() { return this.filterForm.controls };

    constructor(private formBuilder: FormBuilder) {}

    ngOnInit() {
        this.filterForm = this.formBuilder.group({
            keyword: [''],
            period: ['0'],
            visualizationType: ['community'],
            neighborsNumber: ['2', { disabled: true }]
        });

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
        
        // this.filterForm.controls['keyword'].valueChanges.pipe(
        //     debounceTime(400),
        //     tap((keyword) => console.log(keyword))
        // ).subscribe();

        // this.filterForm.controls['neighborsNumber'].valueChanges.pipe(
        //     debounceTime(300),
        //     tap(() => console.log('printou'))
        // ).subscribe();

        this.filterForm.valueChanges
            .pipe(
                debounceTime(400),
                tap(() => {
                    const communityVisualization = this.formControls['visualizationType'].value == 'community' ? true : false;

                    new FiltersModel(
                        this.formControls['keyword'].value,
                        this.formControls['period'].value,
                        communityVisualization,
                        !communityVisualization,
                        this.formControls['neighborsNumber'].value
                    );
                })
            );
    }
}
