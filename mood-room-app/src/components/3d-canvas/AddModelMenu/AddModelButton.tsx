
import { AddModelTab, ModelItem } from "./AddModelTab";

/****** This button is used to add in models into the canvas **************/
interface AddModelButtonProps {
  show: boolean;// should the button show up or not.
  manifestData: ModelItem[] | null; // manifest data to use for adding models, if not provided, will use the default one.
  className?: string;// used for css.
  toggle: () => void;// what to do when it is clicked.
  onAddModel: (model: Omit<ModelItem, 'thumbnail'>) => void;// function to add a model to the scene.
}

export function AddModelButton({ show, manifestData, className = '', toggle, onAddModel }: AddModelButtonProps) {
  return (
    <div className={className}>
      <div className="flex gap-2">
        <button
          onClick={toggle}
          className={`px-4 py-2 rounded text-white hover:cursor-pointer ${
            show ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {show ? 'X' : 'Add'}
        </button>
      </div>
      {show && (
        <aside className="absolute left-0 mt-2 md:w-120 w-64 bg-white p-4 rounded shadow-lg z-20">
          <AddModelTab manifestData={manifestData} onAddModel={onAddModel} />
        </aside>
      )}
    </div>
  );
}
//cahnge 180 to 64 when done